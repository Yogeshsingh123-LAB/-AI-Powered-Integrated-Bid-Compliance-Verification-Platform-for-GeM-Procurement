import { apiFetch, BACKEND_URL } from "../services/api";
import { useEffect, useRef, useState } from "react";
import {
  Info,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  Send,
  X,
  Globe, ChevronDown, FileSearch, TicketPlus, Tickets, Headset, Inbox,
  Minus, Maximize2, Minimize2, RotateCcw, Grip, Move,
} from "lucide-react";
import gemmyIcon from "../assets/gemmy-icon.png";
import "./Chatbot.css";
import { ApplicationTracking, SupportPanel, SupportInbox } from "./ChatTools";
import { detectLanguage, errorText, translations, languageOptions } from "./chatText";
import { useChatWindow } from "./chatWindow";
import { renderChatMessage } from "./chatMessage";

const API_URL = BACKEND_URL;

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome! I’m MyGeM, your AI bid-compliance assistant. Ask me about document uploads, GST/PAN/Udyam checks, risk scores, audit status, or how to use this portal.",
};

const INITIAL_SUGGESTIONS = [
  "How do I upload a bid?",
  "How is the score calculated?",
  "Why is my document flagged?",
  "What is the status of my audit?",
];

function Chatbot({ userRole = "Guest", isSupportAdmin = false }) {
  const [language, setLanguage] = useState(() => {
    try { const saved = localStorage.getItem("mygem-language"); return languageOptions.some(o => o.code === saved) ? saved : "auto"; } catch { return "auto"; }
  });
  const panel = useChatWindow();
  useEffect(() => { try { localStorage.setItem("mygem-language", language); } catch { /* Storage is optional. */ } }, [language]);
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const effectiveLanguage = language === "auto" ? detectedLanguage : language;
  const t = translations[effectiveLanguage];
  const [mode, setMode] = useState("chat");
  const [showAbout, setShowAbout] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pendingRef = useRef(null);
  const generationRef = useRef(0);

  useEffect(() => () => { generationRef.current += 1; pendingRef.current?.abort(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  const resetConversation = () => {
    generationRef.current += 1;
    pendingRef.current?.abort();
    pendingRef.current = null;
    setIsLoading(false);
    setMessages([WELCOME_MESSAGE]);
    setSuggestions(INITIAL_SUGGESTIONS);
    setInput("");
    setMode("chat");
  };

  const sendMessage = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || pendingRef.current) return;
    if (language === "auto") setDetectedLanguage(detectLanguage(trimmedQuestion));
    const responseLanguage = language === "auto" ? detectLanguage(trimmedQuestion) : language;
    const responseText = translations[responseLanguage];
    const generation = generationRef.current;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmedQuestion,
    };
    const conversationHistory = messages
      .filter((message) => message.id !== "welcome" && !message.isError)
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setSuggestions([]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    pendingRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await apiFetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedQuestion,
          history: conversationHistory,
          user_role: userRole,
          language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const failure = new Error("Request failed");
        failure.status = response.status;
        throw failure;
      }

      const data = await response.json();
      if (generation !== generationRef.current) return;
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
      if (generation !== generationRef.current) return;
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          isError: true,
          content: errorText(error.status, responseText),
        },
      ]);
      setSuggestions(responseText.suggestions);
    } finally {
      window.clearTimeout(timeoutId);
      if (generation === generationRef.current) {
        pendingRef.current = null;
        setIsLoading(false);
      }
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
        aria-label="Open MyGeM assistant"
      >
        <span className="gemmy-launcher-pulse" />
        <img className="gemmy-launcher-icon" src={gemmyIcon} alt="" aria-hidden="true" />
        <span>Ask MyGeM</span>
      </button>
    );
  }

  return (
    <section className={`gemmy-widget${panel.style.height < 500 ? ' gemmy-compact' : ''}`} style={panel.style} aria-label="MyGeM" lang={effectiveLanguage === "hinglish" ? "hi-Latn" : effectiveLanguage}>
      <header className="gemmy-header">
        <div className="gemmy-brand" {...panel.handlers()} tabIndex={panel.mobile || panel.expanded ? undefined : 0} role="group" aria-label={t.move} title={t.move}>
          <span className="gemmy-brand-icon">
            <img src={gemmyIcon} alt="" aria-hidden="true" />
          </span>
          <div>
            <strong>Ask MyGeM</strong>
            <span>AI assistant <Move size={11} aria-hidden="true" /></span>
          </div>
        </div>
        <div className="gemmy-header-actions">
          <button type="button" title={t.minimize} aria-label={t.minimize} onClick={() => setIsOpen(false)}><Minus size={17} /></button>
          <button type="button" title={panel.expanded ? t.restore : t.expand} aria-label={panel.expanded ? t.restore : t.expand} onClick={panel.toggle}>{panel.expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          <button type="button" title={t.about} aria-label={t.about} onClick={() => setShowAbout(!showAbout)}>
            <Info size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title={t.close}
            aria-label={t.close}
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {showAbout && <p className="gemmy-about">{t.aboutText}</p>}
      <div className="gemmy-help-strip">
        <label className="gemmy-language"><Globe size={15} aria-hidden="true" /><span className="gemmy-sr-only">{t.language}</span>
          <select aria-label={t.language} value={language} onChange={(e) => { resetConversation(); setLanguage(e.target.value); }}>
            {languageOptions.map(({ code, label }) => <option key={code} value={code}>{code === "auto" ? t.auto : label}</option>)}
          </select><ChevronDown size={13} aria-hidden="true" />
        </label>
        <div className="gemmy-toolbar-actions">
          <button type="button" onClick={resetConversation} title={t.reset} aria-label={t.reset}><RefreshCw size={16} /></button>
          <button type="button" onClick={panel.reset} title={t.resetLayout} aria-label={t.resetLayout}><RotateCcw size={16} /></button>
        </div>
      </div>

      <nav className="gemmy-menu" aria-label="Assistant features">
        {[['chat', MessageCircleQuestion], ['track', FileSearch], ['create', TicketPlus], ['ticket', Tickets], ['live', Headset], ...(isSupportAdmin ? [['staff', Inbox]] : [])].map(([item, Icon]) =>
          <button type="button" key={item} aria-pressed={mode === item} onClick={() => setMode(item)}><Icon size={16} aria-hidden="true" /><span>{t[item]}</span></button>)}
      </nav>

      {mode === "track" && <ApplicationTracking key={effectiveLanguage} language={effectiveLanguage} />}
      {["create", "ticket", "live"].includes(mode) && <SupportPanel key={`${mode}-${effectiveLanguage}`} mode={mode} language={effectiveLanguage} />}
      {mode === "staff" && isSupportAdmin && <SupportInbox key={effectiveLanguage} language={effectiveLanguage} />}

      {mode === "chat" && <><div className="gemmy-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`gemmy-message-row ${message.role}`}>
            {message.role === "assistant" && (
              <span className="gemmy-avatar" aria-hidden="true">
                <img src={gemmyIcon} alt="" />
              </span>
            )}
            <div className={`gemmy-message ${message.isError ? "error" : ""}`}>
              {message.id === "welcome" ? t.welcome : message.role === "assistant" ? renderChatMessage(message.content) : message.content}
              {message.source === "knowledge_base" && (
                <small>{t.kb}</small>
              )}
              {message.source === "ai_web" && (
                <small>{t.web}</small>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="gemmy-message-row assistant">
            <span className="gemmy-avatar" aria-hidden="true">
              <img src={gemmyIcon} alt="" />
            </span>
            <div className="gemmy-message gemmy-typing">
              <Loader2 size={15} className="gemmy-spinner" />
              {t.loading}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && !isLoading && (
        <div className="gemmy-suggestions" aria-label="Suggested questions">
          {(messages.length === 1 ? t.suggestions : suggestions).slice(0, 3).map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className="gemmy-input-area" onSubmit={handleSubmit}>
        <label htmlFor="gemmy-question" className="gemmy-sr-only">{t.question}</label>
        <textarea
          ref={inputRef}
          id="gemmy-question"
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, 2000))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder={t.question}
          rows="1"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="gemmy-send"
          disabled={!input.trim() || isLoading}
          aria-label={t.send}
        >
          <Send size={20} />
        </button>
      </form></>}

      <p className="gemmy-disclaimer">
        {t.disclaimer}
      </p>
      {!panel.mobile && !panel.expanded && ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(edge =>
        <div key={edge} className={`gemmy-resize gemmy-resize-${edge}`} {...panel.handlers(edge)}
          role={edge === 'se' ? 'group' : undefined} tabIndex={edge === 'se' ? 0 : undefined}
          aria-label={edge === 'se' ? t.resize : undefined} title={t.resize}>
          {edge === 'se' && <Grip size={14} aria-hidden="true" />}
        </div>)}
    </section>
  );
}

export default Chatbot;
