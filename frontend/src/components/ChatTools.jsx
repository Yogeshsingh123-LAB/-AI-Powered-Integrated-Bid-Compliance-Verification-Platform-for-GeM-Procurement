import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/api";
import { errorText, formatDate, translations } from "./chatText";

const BASE = "/api/chat/support";
const uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

// Every request is cancelled on unmount; old results cannot leak into a new panel/account.
function useRequest(t) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controllers = useRef(new Set());
  const active = useRef(true);
  const foregroundPending = useRef(false);
  useEffect(() => {
    active.current = true;
    const pending = controllers.current;
    return () => { active.current = false; pending.forEach((c) => c.abort()); };
  }, []);
  const request = useCallback(async (path, options = {}, quiet = false) => {
    if (!quiet && foregroundPending.current) return null;
    if (!quiet) foregroundPending.current = true;
    const controller = new AbortController();
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 20000);
    if (!quiet) { setBusy(true); setError(""); }
    try {
      const response = await apiFetch(path, { ...options, signal: controller.signal, headers: { "Content-Type": "application/json" } });
      if (!response.ok) {
        const failure = new Error("Request failed");
        failure.status = response.status;
        throw failure;
      }
      const result = response.status === 204 ? {} : await response.json();
      return active.current ? result : null;
    } catch (err) {
      if (active.current) setError(errorText(err.status, t));
      return null;
    } finally {
      clearTimeout(timer);
      controllers.current.delete(controller);
      if (!quiet) foregroundPending.current = false;
      if (active.current && !quiet) setBusy(false);
    }
  }, [t]);
  return { request, error, busy };
}

function ReferenceInput({ label, name = "reference", optional = false }) {
  return <label>{label}<input name={name} required={!optional} pattern={uuidPattern} maxLength={36} autoComplete="off" spellCheck={false} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>;
}

export function ApplicationTracking({ language }) {
  const t = translations[language];
  const { request, busy, error } = useRequest(t);
  const [result, setResult] = useState(null);
  async function lookup(event) {
    event.preventDefault();
    if (busy) return;
    setResult(null);
    const reference = new FormData(event.currentTarget).get("reference").trim();
    setResult(await request("/api/chat/track", { method: "POST", body: JSON.stringify({ reference }) }));
  }
  return <div className="gemmy-tool">
    <p>{t.referenceHelp}</p>
    <form onSubmit={lookup}><ReferenceInput label={t.reference} /><button disabled={busy}>{busy ? t.loading : t.lookup}</button></form>
    {error && <p role="alert">{error}</p>}
    {result && <article className="gemmy-status-card" aria-live="polite">
      <strong>{t.status}: {t.statuses[result.status]}</strong>
      <dl><dt>{t.reference}</dt><dd className="gemmy-reference">{result.reference}</dd>
        <dt>{t.submitted}</dt><dd>{formatDate(result.submitted_at, language)}</dd>
        <dt>{t.reviewed}</dt><dd>{formatDate(result.reviewed_at, language)}</dd></dl>
      <strong>{t.next}</strong><p>{t.actions[result.next_action]}</p>
    </article>}
  </div>;
}

export function SupportPanel({ mode, language }) {
  const t = translations[language];
  const { request, busy, error } = useRequest(t);
  const [ticket, setTicket] = useState(null);
  const [available, setAvailable] = useState(null);
  useEffect(() => {
    if (mode !== "live") return;
    let stopped = false;
    async function check() {
      const result = await request(`${BASE}/availability`, {}, true);
      if (!stopped) setAvailable(result ? result.available : null);
    }
    check();
    const timer = setInterval(check, 30000);
    return () => { stopped = true; clearInterval(timer); };
  }, [mode, request]);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (mode === "ticket") {
      const result = await request(`${BASE}/tickets/${encodeURIComponent(data.get("reference").trim())}`);
      if (result) setTicket(result);
    } else {
      const result = await request(`${BASE}/tickets`, { method: "POST", body: JSON.stringify({
        subject: data.get("subject").trim(), message: data.get("message").trim(),
        application_reference: data.get("reference").trim() || null,
      }) });
      if (result) setTicket(result);
    }
  }
  if (ticket) return <TicketConversation initialTicket={ticket} language={language} onBack={() => setTicket(null)} />;
  return <div className="gemmy-tool">
    {mode === "live" && <p role="status">{available === null ? t.loading : available ? t.online : t.offline}</p>}
    <form onSubmit={submit}>
      {mode === "ticket" ? <ReferenceInput label={t.ticketReference} /> : <>
        <label>{t.subject}<input name="subject" required minLength={3} maxLength={160} /></label>
        <label>{t.issue}<textarea name="message" required minLength={3} maxLength={2000} rows={3} /></label>
        <ReferenceInput label={t.optionalReference} optional />
        <p className="gemmy-muted">{t.consent}</p>
      </>}
      <button disabled={busy}>{busy ? t.loading : mode === "ticket" ? t.lookup : t.createTicket}</button>
    </form>
    {error && <p role="alert">{error}</p>}
  </div>;
}

function TicketConversation({ initialTicket, language, onBack, staff = false }) {
  const t = translations[language];
  const { request, busy, error } = useRequest(t);
  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const path = `${BASE}/${staff ? "staff/" : ""}tickets/${ticket.id}`;
  useEffect(() => {
    let stopped = false;
    let timer;
    async function refresh() {
      const rows = await request(`${path}/messages`, {}, true);
      if (stopped) return;
      if (rows) setMessages(rows);
      const status = await request(path, {}, true);
      if (!stopped && status) setTicket(status);
      if (!stopped) timer = setTimeout(refresh, 10000);
    }
    refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, [path, request, staff]);
  async function send(event) {
    event.preventDefault();
    if (busy || !reply.trim()) return;
    const sent = await request(`${path}/messages`, { method: "POST", body: JSON.stringify({ content: reply.trim() }) });
    if (sent) {
      setReply("");
      setMessages((old) => old.some((m) => m.id === sent.id) ? old : [...old, sent]);
      const status = await request(path, {}, true);
      if (status) setTicket(status);
    }
  }
  async function update() {
    const result = await request(staff ? path : `${path}/escalate`, {
      method: staff ? "PATCH" : "POST",
      ...(staff ? { body: JSON.stringify({ status: ticket.status === "resolved" ? "open" : "resolved" }) } : {}),
    });
    if (result) setTicket(result);
  }
  return <div className="gemmy-tool">
    <button type="button" onClick={onBack}>{t.back}</button>
    <article className="gemmy-status-card">
      <strong>{ticket.subject}</strong><p>{t.ticketReference}: <span className="gemmy-reference">{ticket.id}</span></p>
      <p>{t.saved}</p><p>{t.status}: {t.statuses[ticket.status]}</p>
      <p>{t.updated}: {formatDate(ticket.updated_at, language)}</p>
      {ticket.escalated_at && <p>{t.escalated}</p>}
      {(staff || (!ticket.escalated_at && ticket.status !== "resolved")) &&
        <button type="button" disabled={busy} onClick={update}>{staff ? ticket.status === "resolved" ? t.reopen : t.resolve : t.escalate}</button>}
    </article>
    <p className="gemmy-muted">{t.conversation}</p>
    <div className="gemmy-support-messages" aria-live="polite">
      {messages.map((m) => <div key={m.id} className={`gemmy-support-message ${m.sender_kind}`}>
        <strong>{m.sender_kind === "agent" ? t.agent : staff ? t.applicantName : t.applicant}</strong>
        <p>{m.content}</p><small>{formatDate(m.created_at, language)}</small>
      </div>)}
    </div>
    {ticket.status !== "resolved" && <form onSubmit={send}>
      <label>{staff ? t.replyApplicant : t.reply}<textarea value={reply} maxLength={2000} required onChange={(e) => setReply(e.target.value)} /></label>
      <button disabled={busy || !reply.trim()}>{t.send}</button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function SupportInbox({ language }) {
  const t = translations[language];
  const { request, error } = useRequest(t);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [offset, setOffset] = useState(0);
  const refresh = useCallback(async () => {
    const rows = await request(`${BASE}/staff/tickets?offset=${offset}`, {}, true);
    if (rows) setTickets(rows);
  }, [request, offset]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    const ping = () => request(`${BASE}/staff/presence`, { method: "POST" }, true);
    ping();
    const timer = setInterval(ping, 20000);
    return () => {
      clearInterval(timer);
      apiFetch(`${BASE}/staff/presence`, { method: "DELETE", keepalive: true }).catch(() => {});
    };
  }, [request]);
  if (selected) return <TicketConversation key={selected.id} initialTicket={selected} language={language} staff onBack={() => { setSelected(null); refresh(); }} />;
  return <div className="gemmy-tool">
    <h3>{t.inbox}</h3><button onClick={refresh}>{t.refresh}</button>
    {tickets.length === 0 && <p>{t.noTickets}</p>}
    {tickets.map((ticket) => <button className="gemmy-ticket-row" key={ticket.id} onClick={() => setSelected(ticket)}>
      <strong>{ticket.subject}</strong><span>{t.statuses[ticket.status]}{ticket.escalated_at ? ` · ${t.escalated}` : ""}</span>
      <small className="gemmy-reference">{ticket.id}</small>
    </button>)}
    <button disabled={!offset} onClick={() => setOffset((n) => Math.max(0, n - 50))}>{t.previous}</button>
    <button disabled={tickets.length < 50} onClick={() => setOffset((n) => n + 50)}>{t.more}</button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
