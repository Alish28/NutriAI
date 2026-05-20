import { useState, useEffect, useRef } from 'react';
import './aiChatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function AIChatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your NutriAI assistant.\n\nI can help you with:\n• 🍽️ Meal ideas & dish suggestions\n• 🔥 Calories & nutrition questions\n• 🏪 Marketplace & ordering help\n• 🥗 Dietary & healthy eating advice\n• 🥫 Pantry & ingredient tips\n\nWhat can I help you with today?'
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
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Request failed');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError('⚠️ Could not reach the AI. Please try again.');
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
      content: '👋 Chat cleared! Ask me anything about food or nutrition.'
    }]);
    setError('');
  };

  // Convert newlines to <br> elements for display
  const formatText = (text) => {
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  const suggestions = [
    '🥗 Suggest a healthy lunch',
    '🔥 Calories in dal bhat?',
    '🏪 How does ordering work?',
    '🌱 What vegan options exist?',
  ];

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        className={`chatFab ${open ? 'chatFabOpen' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close AI Assistant' : 'Ask AI about food & nutrition'}
        aria-label="Toggle AI chat assistant"
      >
        <span className="chatFabIcon">{open ? '✕' : '🤖'}</span>
        {!open && <span className="chatFabLabel">Ask AI</span>}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div className="chatPanel" role="dialog" aria-label="NutriAI Chat Assistant">

          {/* Header */}
          <div className="chatHeader">
            <div className="chatHeaderLeft">
              <div className="chatAvatar">🤖</div>
              <div className="chatHeaderInfo">
                <div className="chatName">NutriAI Assistant</div>
                <div className="chatOnline">
                  <span className="chatOnlineDot" />
                  Online · Food & Nutrition AI
                </div>
              </div>
            </div>
            <div className="chatHeaderActions">
              <button
                className="chatClearBtn"
                onClick={clearChat}
                title="Clear conversation"
                aria-label="Clear chat"
              >
                🗑️
              </button>
              <button
                className="chatCloseBtn"
                onClick={() => setOpen(false)}
                title="Close"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatMessages" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chatMsg chatMsg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="chatMsgAvatar" aria-hidden="true">🤖</div>
                )}
                <div className="chatMsgBubble">
                  {formatText(m.content)}
                </div>
                {m.role === 'user' && (
                  <div className="chatMsgAvatar chatMsgAvatarUser" aria-hidden="true">👤</div>
                )}
              </div>
            ))}

            {/* Typing indicator while waiting for response */}
            {loading && (
              <div className="chatMsg chatMsg--assistant">
                <div className="chatMsgAvatar" aria-hidden="true">🤖</div>
                <div className="chatMsgBubble chatTyping" aria-label="AI is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="chatError" role="alert">{error}</div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips — only shown on fresh chat */}
          {messages.length === 1 && (
            <div className="chatSuggestions" role="toolbar" aria-label="Suggested questions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="chatSuggestionChip"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
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
              placeholder="Ask about food, nutrition, recipes…"
              rows={1}
              disabled={loading}
              aria-label="Type your message"
            />
            <button
              className="chatSendBtn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>

          <div className="chatFooter">
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      )}
    </>
  );
}