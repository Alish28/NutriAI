// src/components/AIChatbot.jsx
// Global AI chat widget — import and drop into any page.
// Calls your own backend /api/chat which proxies to Anthropic.
// No CORS issues, no API key exposed in the browser.

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
      content: '👋 Hi! I\'m your NutriAI assistant.\n\nI can help you with:\n• 🍽️ Finding dishes & meal ideas\n• 📊 Nutrition & calorie questions\n• 🏪 Marketplace & ordering help\n• 🥗 Dietary advice\n\nWhat can I help you with today?'
    }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Scroll to bottom whenever messages change or panel opens
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
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Request failed');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError('⚠️ Could not reach the AI. Please try again.');
      // Remove the user message that failed so they can retry
      setMessages(prev => prev.slice(0, -1));
      setInput(text); // restore input
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

  // Format message text — convert newlines and basic markdown
  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`chatFab ${open ? 'chatFabOpen' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close AI Assistant' : 'Open AI Assistant'}
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
                  Online
                </div>
              </div>
            </div>
            <div className="chatHeaderActions">
              <button className="chatClearBtn" onClick={clearChat} title="Clear chat">
                🗑️
              </button>
              <button className="chatCloseBtn" onClick={() => setOpen(false)} title="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatMessages">
            {messages.map((m, i) => (
              <div key={i} className={`chatMsg chatMsg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="chatMsgAvatar">🤖</div>
                )}
                <div className="chatMsgBubble">
                  {formatText(m.content)}
                </div>
                {m.role === 'user' && (
                  <div className="chatMsgAvatar chatMsgAvatarUser">👤</div>
                )}
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

            {/* Error message */}
            {error && (
              <div className="chatError">{error}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts — shown when only 1 message (the welcome) */}
          {messages.length === 1 && (
            <div className="chatSuggestions">
              {[
                '🥗 Suggest a healthy lunch',
                '🔥 How many calories in dal bhat?',
                '🏪 How does ordering work?',
                '🌱 What vegan options are available?',
              ].map((s, i) => (
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

          {/* Input Area */}
          <div className="chatInputArea">
            <textarea
              ref={inputRef}
              className="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about food, nutrition, orders…"
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
          <div className="chatFooter">Press Enter to send · Shift+Enter for new line</div>
        </div>
      )}
    </>
  );
}