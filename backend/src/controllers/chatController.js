/*Proxies chat requests to Anthropic API server-side.
This is necessary because calling Anthropic directly from the browser
is blocked by CORS policy. The backend acts as a secure proxy.*/

const https = require('https');

exports.chat = async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messages array is required'
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your .env file.'
      });
    }

    // Build the request body for Anthropic
    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt || `You are NutriAI's friendly assistant. You help users with:
- Finding dishes that match their dietary needs (vegetarian, vegan, gluten-free, dairy-free, etc.)
- Understanding nutrition, calories, macros, and healthy eating
- Navigating the homecook marketplace
- Questions about ordering, pickup, and reviews
- Cooking tips, recipe suggestions, and meal planning
- Pantry management and reducing food waste

The app is NutriAI, based in Nepal. Prices in the marketplace are in NPR (Nepali Rupees).
Be concise, friendly, and helpful. Use emojis naturally but don't overdo it.`,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    });

    // Make the request to Anthropic from the server (no CORS issues)
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const anthropicReq = https.request(options, (anthropicRes) => {
      let data = '';
      anthropicRes.on('data', chunk => { data += chunk; });
      anthropicRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (anthropicRes.statusCode !== 200) {
            console.error('Anthropic API error:', parsed);
            return res.status(anthropicRes.statusCode).json({
              success: false,
              message: parsed.error?.message || 'Anthropic API error'
            });
          }
          const reply = parsed.content?.[0]?.text || 'Sorry, I could not process that.';
          res.json({ success: true, reply });
        } catch (e) {
          res.status(500).json({ success: false, message: 'Failed to parse Anthropic response' });
        }
      });
    });

    anthropicReq.on('error', (err) => {
      console.error('Error calling Anthropic:', err);
      res.status(500).json({ success: false, message: 'Failed to reach Anthropic API' });
    });

    anthropicReq.write(requestBody);
    anthropicReq.end();

  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};