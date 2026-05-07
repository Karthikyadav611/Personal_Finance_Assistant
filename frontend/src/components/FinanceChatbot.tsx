import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notifyFinanceDataUpdated } from "@/utils/financeEvents";
import { API_BASE_URL } from "@/config/api";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

const API_URL = API_BASE_URL;

/* ── Typing dots ── */
const TypingIndicator = () => (
  <div className="fc-typing-row">
    <div className="fc-avatar fc-avatar-bot">
      <Bot size={14} />
    </div>
    <div className="fc-bubble fc-bubble-bot fc-typing-bubble">
      <span className="fc-dot" style={{ animationDelay: "0s" }} />
      <span className="fc-dot" style={{ animationDelay: "0.16s" }} />
      <span className="fc-dot" style={{ animationDelay: "0.32s" }} />
    </div>
  </div>
);

/* ── Single message ── */
const ChatMessage = ({ message, index }: { message: Message; index: number }) => {
  const isUser = message.type === "user";
  return (
    <div
      className={`fc-message-row ${isUser ? "fc-row-user" : "fc-row-bot"}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {!isUser && (
        <div className="fc-avatar fc-avatar-bot">
          <Bot size={14} />
        </div>
      )}
      <div className={`fc-bubble ${isUser ? "fc-bubble-user" : "fc-bubble-bot"}`}>
        <p className="fc-bubble-text">{message.content}</p>
        <p className="fc-bubble-time">{message.timestamp}</p>
      </div>
      {isUser && (
        <div className="fc-avatar fc-avatar-user">
          <User size={14} />
        </div>
      )}
    </div>
  );
};

/* ── Suggestion chip ── */
const SuggestionChip = ({
  label,
  onClick,
  index,
}: {
  label: string;
  onClick: () => void;
  index: number;
}) => (
  <button
    className="fc-chip"
    onClick={onClick}
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <Zap size={10} className="fc-chip-icon" />
    {label}
  </button>
);

export const FinanceChatbot = () => {
  const [suggestions, setSuggestions] = useState([
    "What is today's date?",
    "Show my recent transactions",
    "How can I save money?",
    "AAPL price",
    "Set budget for travel 5000",
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I can read your live transactions and budgets, log new expenses or income, update budgets, and answer market questions like stock prices, movers, and headlines.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: trimmedMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    if (!token) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "Please log in first so I can access your live finance data and perform actions safely.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setIsTyping(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Server error: ${response.status}`);
      if (data?.data?.action?.performed) notifyFinanceDataUpdated();
      if (Array.isArray(data?.data?.suggestions) && data.data.suggestions.length > 0) {
        setSuggestions(data.data.suggestions);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          type: "bot",
          content: data.reply || "Sorry, I couldn't process that request.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          type: "bot",
          content:
            error instanceof Error
              ? error.message
              : "Error connecting to the finance assistant. Please check your backend server.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes fc-slide-in-bot {
          from { opacity:0; transform: translateX(-16px) scale(0.95); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }
        @keyframes fc-slide-in-user {
          from { opacity:0; transform: translateX(16px) scale(0.95); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }
        @keyframes fc-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity:0.4; }
          40%            { transform: translateY(-6px); opacity:1; }
        }
        @keyframes fc-chip-in {
          from { opacity:0; transform: translateY(8px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes fc-header-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(59,130,246,0.15); }
          50%       { box-shadow: 0 0 36px rgba(59,130,246,0.3); }
        }
        @keyframes fc-status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          60%       { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes fc-send-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Card shell ── */
        .fc-card {
          background: rgba(10,18,38,0.75);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(99,179,237,0.14);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Header ── */
        .fc-header {
          padding: 20px 24px 18px;
          background: linear-gradient(135deg, rgba(17,27,60,0.9), rgba(10,22,50,0.95));
          border-bottom: 1px solid rgba(99,179,237,0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fc-header-glow 4s ease infinite;
        }
        .fc-header-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(37,99,235,0.45);
          flex-shrink: 0;
        }
        .fc-header-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.01em;
          font-family: 'DM Serif Display', Georgia, serif;
        }
        .fc-header-sub {
          font-size: 0.72rem;
          color: rgba(148,163,184,0.7);
          margin-top: 1px;
          letter-spacing: 0.04em;
        }
        .fc-status-badge {
          margin-left: auto;
          display: flex; align-items: center; gap: 6px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.7rem;
          color: #86efac;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .fc-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: fc-status-pulse 2s ease infinite;
        }

        /* ── Messages area ── */
        .fc-messages {
          flex: 1;
          min-height: 320px;
          max-height: 360px;
          overflow-y: auto;
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,179,237,0.2) transparent;
        }
        .fc-messages::-webkit-scrollbar { width: 4px; }
        .fc-messages::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.2); border-radius: 4px; }

        /* ── Message rows ── */
        .fc-message-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }
        .fc-row-bot  { justify-content: flex-start; animation: fc-slide-in-bot  0.38s cubic-bezier(.22,1,.36,1) both; }
        .fc-row-user { justify-content: flex-end;   animation: fc-slide-in-user 0.38s cubic-bezier(.22,1,.36,1) both; }

        /* ── Avatars ── */
        .fc-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: white;
        }
        .fc-avatar-bot  { background: linear-gradient(135deg, #2563eb, #0ea5e9); box-shadow: 0 2px 10px rgba(37,99,235,0.4); }
        .fc-avatar-user { background: linear-gradient(135deg, #475569, #334155); box-shadow: 0 2px 10px rgba(0,0,0,0.3); }

        /* ── Bubbles ── */
        .fc-bubble {
          max-width: min(72%, 340px);
          padding: 10px 14px;
          border-radius: 16px;
          position: relative;
        }
        .fc-bubble-bot {
          background: rgba(30,41,80,0.85);
          border: 1px solid rgba(99,179,237,0.12);
          border-bottom-left-radius: 4px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .fc-bubble-user {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35);
        }
        .fc-bubble-text {
          font-size: 0.82rem;
          color: #e2e8f0;
          line-height: 1.55;
          margin: 0;
        }
        .fc-bubble-time {
          font-size: 0.65rem;
          color: rgba(148,163,184,0.55);
          margin-top: 5px;
          margin-bottom: 0;
        }

        /* ── Typing bubble ── */
        .fc-typing-row {
          display: flex; align-items: flex-end; gap: 8px;
          animation: fc-slide-in-bot 0.3s cubic-bezier(.22,1,.36,1) both;
        }
        .fc-typing-bubble {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 16px;
        }
        .fc-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: rgba(147,197,253,0.7);
          animation: fc-dot-bounce 1.1s ease-in-out infinite;
        }

        /* ── Input area ── */
        .fc-input-area {
          padding: 14px 18px;
          border-top: 1px solid rgba(99,179,237,0.08);
          background: rgba(8,14,32,0.6);
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .fc-input-wrap {
          flex: 1;
          position: relative;
        }
        .fc-input {
          width: 100%;
          background: rgba(20,32,65,0.8);
          border: 1px solid rgba(99,179,237,0.18);
          border-radius: 14px;
          padding: 11px 44px 11px 16px;
          font-size: 0.82rem;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          font-family: inherit;
        }
        .fc-input::placeholder { color: rgba(100,116,139,0.7); }
        .fc-input:focus {
          border-color: rgba(59,130,246,0.55);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .fc-input-icon {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          color: rgba(100,116,139,0.5);
          pointer-events: none;
        }
        .fc-send {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #0ea5e9);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 16px rgba(37,99,235,0.4);
          color: white;
        }
        .fc-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .fc-send:not(:disabled):hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(37,99,235,0.55); }
        .fc-send:not(:disabled):active { transform: scale(0.95); }

        /* ── Suggestions ── */
        .fc-suggestions {
          padding: 10px 18px 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .fc-suggestions-label {
          width: 100%;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(100,116,139,0.6);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .fc-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(30,41,80,0.6);
          border: 1px solid rgba(99,179,237,0.15);
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 0.71rem;
          color: rgba(148,163,184,0.85);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
          animation: fc-chip-in 0.4s cubic-bezier(.22,1,.36,1) both;
          font-family: inherit;
          line-height: 1;
        }
        .fc-chip:hover {
          background: rgba(37,99,235,0.2);
          border-color: rgba(59,130,246,0.4);
          color: #93c5fd;
          transform: translateY(-1px);
        }
        .fc-chip-icon {
          color: rgba(59,130,246,0.6);
          flex-shrink: 0;
        }
      `}</style>

      <div className="fc-card">
        {/* ── Header ── */}
        <div className="fc-header">
          <div className="fc-header-icon">
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div className="fc-header-title">Finance Assistant</div>
            <div className="fc-header-sub">AI-powered · Live data</div>
          </div>
          <div className="fc-status-badge">
            <div className="fc-status-dot" />
            ONLINE
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="fc-messages">
          {messages.map((msg, i) => (
            <ChatMessage key={msg.id} message={msg} index={i} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="fc-input-area">
          <div className="fc-input-wrap">
            <input
              ref={inputRef}
              className="fc-input"
              placeholder="Try: spent 450 on food, AAPL price, market news…"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </div>
          <button
            className="fc-send"
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>

        {/* ── Suggestions ── */}
        <div className="fc-suggestions">
          <div className="fc-suggestions-label">
            <Zap size={9} />
            Quick prompts
          </div>
          {suggestions.map((s, i) => (
            <SuggestionChip
              key={s}
              label={s}
              index={i}
              onClick={() => {
                setInputMessage(s);
                inputRef.current?.focus();
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
