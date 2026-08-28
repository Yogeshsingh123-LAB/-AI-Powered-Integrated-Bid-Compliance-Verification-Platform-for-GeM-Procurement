import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Info,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import "./Chatbot.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome! I’m GeMmy, your AI bid-compliance assistant. Ask me about document uploads, GST/PAN/Udyam checks, risk scores, audit status, or how to use this portal.",
};

const INITIAL_SUGGESTIONS = [
  "How do I upload a bid?",
  "How is the score calculated?",
  "Which documents are checked?",
];

function Chatbot({ userRole = "Guest" }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const resetConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setSuggestions(INITIAL_SUGGESTIONS);
    setInput("");
  };

  const sendMessage = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedQuestion,
    };
    const conversationHistory = messages
      .filter((message) => message.id !== "welcome")
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setSuggestions([]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedQuestion,
          history: conversationHistory,
          user_role: userRole,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Assistant service returned ${response.status}`);
      }

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.answer,
          source: data.source,
        },
      ]);
      setSuggestions(data.suggestions || INITIAL_SUGGESTIONS);
    } catch (error) {
      const timedOut = error.name === "AbortError";
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          isError: true,
          content: timedOut
            ? "The assistant took too long to respond. Please try again."
            : "I can’t reach the assistant service right now. Please start the FastAPI backend on port 8000 and try again.",
        },
      ]);
      setSuggestions(INITIAL_SUGGESTIONS);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="gemmy-launcher"
        onClick={() => setIsOpen(true)}
        aria-label="Open GeMmy assistant"
      >
        <span className="gemmy-launcher-pulse" />
        <Sparkles size={23} aria-hidden="true" />
        <span>Ask GeMmy</span>
      </button>
    );
  }

  return (
    <section className="gemmy-widget" aria-label="GeMmy bid compliance assistant">
      <header className="gemmy-header">
        <div className="gemmy-brand">
          <span className="gemmy-brand-icon"><Sparkles size={21} /></span>
          <div>
            <strong>Ask GeMmy</strong>
            <span>AI compliance assistant</span>
          </div>
        </div>
        <div className="gemmy-header-actions">
          <button type="button" title="About GeMmy" aria-label="About GeMmy">
            <Info size={18} />
          </button>
          <button
            type="button"
            onClick={resetConversation}
            title="Start a new conversation"
            aria-label="Start a new conversation"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Close assistant"
            aria-label="Close assistant"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="gemmy-help-strip">
        <MessageCircleQuestion size={15} />
        Ask about this portal or bid compliance
      </div>

      <div className="gemmy-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`gemmy-message-row ${message.role}`}>
            {message.role === "assistant" && (
              <span className="gemmy-avatar" aria-hidden="true"><Bot size={17} /></span>
            )}
            <div className={`gemmy-message ${message.isError ? "error" : ""}`}>
              {message.content}
              {message.source === "knowledge_base" && (
                <small>Portal knowledge base</small>
              )}
              {message.source === "ai_web" && (
                <small>Live web answer via Groq</small>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="gemmy-message-row assistant">
            <span className="gemmy-avatar" aria-hidden="true"><Bot size={17} /></span>
            <div className="gemmy-message gemmy-typing">
              <Loader2 size={15} className="gemmy-spinner" />
              Checking the guidance…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && !isLoading && (
        <div className="gemmy-suggestions" aria-label="Suggested questions">
          {suggestions.slice(0, 3).map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className="gemmy-input-area" onSubmit={handleSubmit}>
        <label htmlFor="gemmy-question" className="gemmy-sr-only">Type your question</label>
        <textarea
          ref={inputRef}
          id="gemmy-question"
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Type a question…"
          rows="1"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="gemmy-send"
          disabled={!input.trim() || isLoading}
          aria-label="Send question"
        >
          <Send size={20} />
        </button>
      </form>

      <p className="gemmy-disclaimer">
        AI answers are informational and may contain errors. Verify tender-specific or legal guidance on the official GeM portal.
      </p>
    </section>
  );
}

export default Chatbot;
