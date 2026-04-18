// src/components/AIChatbot.jsx
// Global AI chat widget — powered by Llama (via Ollama on your backend).
// Calls POST /api/chat on your Express server.
// No CORS issues. No API key needed. Completely free.

import { useState, useEffect, useRef } from 'react';
import './AIChatbot.css';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AIChatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your NutriAI assistant powered by Llama AI.\n\nI can help you with:\n• 🍽️ Meal ideas & recipes\n• 📊 Nutrition questions\n• 🏪 Marketplace help\n• 🥗 Dietary advice\n• 🥫 Using up pantry items\n\nWhat can I help you with today?'
    }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Request failed');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError('⚠️ ' + (err.message || 'Could not reach the AI. Please try again.'));
      // Restore user message so they can retry
      setMessages(prev => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '👋 Chat cleared! How can I help you?'
    }]);
    setError('');
  };

  const formatText = (text) =>
    text.split('\n').map((line, i, arr) => (
      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
    ));

  // Quick suggestion chips shown on fresh chat
  const suggestions = [
    '🥗 Suggest a healthy lunch',
    '🔥 How many calories in dal bhat?',
    '🏪 How does ordering work?',
    '🌱 What vegan meals can I make?',
    '🥫 Recipe using rice and lentils',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`chatFab ${open ? 'chatFabOpen' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close AI Assistant' : 'Ask AI (powered by Llama)'}
      >
        <span className="chatFabIcon">{open ? '✕' : '🤖'}</span>
        {!open && <span className="chatFabLabel">Ask AI</span>}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="chatPanel">

          {/* Header */}
          <div className="chatHeader">
            <div className="chatHeaderLeft">
              <div className="chatAvatar">🤖</div>
              <div className="chatHeaderInfo">
                <div className="chatName">NutriAI Assistant</div>
                <div className="chatOnline">
                  <span className="chatOnlineDot" />
                  Llama AI · Local
                </div>
              </div>
            </div>
            <div className="chatHeaderActions">
              <button className="chatClearBtn" onClick={clearChat} title="Clear chat">🗑️</button>
              <button className="chatCloseBtn" onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatMessages">
            {messages.map((m, i) => (
              <div key={i} className={`chatMsg chatMsg--${m.role}`}>
                {m.role === 'assistant' && <div className="chatMsgAvatar">🤖</div>}
                <div className="chatMsgBubble">{formatText(m.content)}</div>
                {m.role === 'user' && <div className="chatMsgAvatar chatMsgAvatarUser">👤</div>}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="chatMsg chatMsg--assistant">
                <div className="chatMsgAvatar">🤖</div>
                <div className="chatMsgBubble chatTyping">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="chatError">{error}</div>}

            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips — only shown on fresh chat */}
          {messages.length === 1 && (
            <div className="chatSuggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chatSuggestionChip"
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatInputArea">
            <textarea
              ref={inputRef}
              className="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about food, nutrition, recipes…"
              rows={1}
              disabled={loading}
            />
            <button
              className="chatSendBtn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>
          <div className="chatFooter">Enter to send · Shift+Enter for new line</div>
        </div>
      )}
    </>
  );
}