const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.1-8b-instant'; // Free, fast, no card needed

/**
 * Call Groq API
 * Groq uses the OpenAI-compatible format which is simple:
 * - system, user, assistant roles all work
 * - Same format as OpenAI so easy to understand
 */
function callGroq(messages, systemPrompt) {
  return new Promise((resolve, reject) => {

    // Build messages array with system prompt first
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const requestBody = JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages,
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          // Handle Groq API errors
          if (parsed.error) {
            reject(new Error(`Groq API error: ${parsed.error.message}`));
            return;
          }

          // Extract reply from OpenAI-compatible response format
          const reply = parsed?.choices?.[0]?.message?.content;

          if (!reply) {
            resolve('Sorry, I could not generate a response. Please try again.');
            return;
          }

          resolve(reply.trim());
        } catch (e) {
          reject(new Error('Failed to parse Groq response: ' + e.message));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Failed to connect to Groq API: ' + err.message));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Groq request timed out after 30 seconds'));
    });

    req.write(requestBody);
    req.end();
  });
}

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messages array is required'
      });
    }

    // Check API key is configured
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is not set in environment variables');
      return res.status(503).json({
        success: false,
        message: 'AI assistant is not configured. Please contact support.'
      });
    }

    const systemPrompt = `You are NutriAI Assistant, a helpful AI built into the NutriAI app — a food tracking and homecook marketplace app based in Nepal.

STRICT RULES — follow these no matter what:
1. You ONLY answer questions about: food, recipes, nutrition, calories, macros, meal planning, dietary advice, ingredients, cooking tips, pantry management, and the NutriAI app features (marketplace, ordering, homecooks, meal logging).
2. If the user asks anything NOT related to food, nutrition, or the NutriAI app, politely decline and redirect them. Say: "I'm only able to help with food and nutrition topics. Is there something food-related I can help you with?"
3. NEVER discuss politics, news, coding, relationships, finance, or any non-food topic.
4. Your name is "NutriAI Assistant". Do NOT say you are Llama, Groq, or any other AI. If asked, say: "I'm NutriAI Assistant, your personal food and nutrition guide."

APP CONTEXT:
- NutriAI is a meal tracking and homecook marketplace app based in Nepal
- Users can log daily meals: breakfast, lunch, dinner, snacks
- Users track nutrition: calories, protein, carbs, fats
- There is a Homecook Marketplace where approved home chefs sell homemade meals
- All marketplace orders are pickup only — no delivery
- Prices are in NPR (Nepali Rupees)
- The app helps users meet nutrition goals: weight management, muscle gain, heart health, etc.
- Users have a pantry tracker to manage ingredients and expiry dates

TOPICS YOU CAN HELP WITH:
- Calories and nutrition info for Nepali and international dishes (dal bhat, momos, etc.)
- Meal suggestions based on dietary needs (vegetarian, vegan, gluten-free, etc.)
- How to use NutriAI app features (logging meals, marketplace, pantry tracker)
- Healthy eating tips and meal planning
- Recipe suggestions and cooking advice
- Understanding macros (protein, carbs, fats)
- Managing pantry items and reducing food waste
- Questions about ordering from homecooks on the marketplace

STYLE:
- Be friendly, warm, and concise
- Use emojis naturally but not excessively
- Keep responses under 150 words unless a detailed recipe is genuinely needed
- Use simple language, not overly technical`;

    console.log(`🤖 Calling Groq (${GROQ_MODEL}) with ${messages.length} messages`);

    const reply = await callGroq(messages, systemPrompt);

    console.log('✅ Groq response received');
    res.json({ success: true, reply });

  } catch (error) {
    console.error('❌ Chat controller error:', error.message);

    let userMessage = 'Failed to get AI response. Please try again.';

    if (error.message.includes('invalid_api_key') || error.message.includes('API key')) {
      userMessage = 'AI assistant configuration error. Please contact support.';
    } else if (error.message.includes('timed out')) {
      userMessage = 'AI assistant is taking too long. Please try again.';
    } else if (error.message.includes('rate_limit') || error.message.includes('quota')) {
      userMessage = 'AI assistant is busy right now. Please try again in a moment.';
    }

    res.status(503).json({
      success: false,
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};