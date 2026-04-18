const http = require('http');
 
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
 
// Helper: call Ollama API
function callOllama(messages, systemPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      stream: false  // get the full response at once
    });
 
    const options = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
 
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Ollama returns: { message: { role, content }, done: true }
          const reply = parsed.message?.content || 'Sorry, I could not generate a response.';
          resolve(reply);
        } catch (e) {
          reject(new Error('Failed to parse Ollama response: ' + e.message));
        }
      });
    });
 
    req.on('error', (err) => {
      // Give a helpful error if Ollama isn't running
      if (err.code === 'ECONNREFUSED') {
        reject(new Error(
          'Ollama is not running. Please start it with: ollama serve'
        ));
      } else {
        reject(err);
      }
    });
 
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Ollama request timed out after 30 seconds'));
    });
 
    req.write(body);
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
 
    const systemPrompt = `You are NutriAI's friendly assistant. You help users with:
- Finding dishes that match their dietary needs (vegetarian, vegan, gluten-free, etc.)
- Understanding nutrition, calories, macros, and healthy eating
- Navigating the homecook marketplace
- Questions about ordering, pickup, and reviews
- Cooking tips, recipe suggestions, and meal planning
- Pantry management and reducing food waste
 
The app is NutriAI, based in Nepal. Prices are in NPR (Nepali Rupees).
Be concise, friendly, and helpful. Use emojis naturally but not excessively.
Keep responses under 150 words unless a detailed answer is genuinely needed.`;
 
    console.log(`🤖 Calling Ollama (${OLLAMA_MODEL}) with ${messages.length} messages`);
 
    const reply = await callOllama(messages, systemPrompt);
 
    console.log('✅ Ollama response received');
    res.json({ success: true, reply });
 
  } catch (error) {
    console.error('❌ Chat controller error:', error.message);
 
    // Return a user-friendly error
    const isOllamaDown = error.message.includes('Ollama is not running');
    res.status(503).json({
      success: false,
      message: isOllamaDown
        ? 'AI assistant is currently offline. Please ensure Ollama is running.'
        : 'Failed to get AI response. Please try again.',
      error: error.message
    });
  }
};
 