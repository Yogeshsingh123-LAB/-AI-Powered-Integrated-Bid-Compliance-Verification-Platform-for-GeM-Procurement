import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/api";
import { formatDate, translations } from "./chatText";
import { requestChatJson } from "./chatRequest";
import { trackingTranslations } from "./chatTrackingText";
import { Search, FileSearch, ArrowRight, ChevronLeft } from "lucide-react";

const BASE = "/api/chat/support";
const uuidPattern = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

// Every request is cancelled on unmount; old results cannot leak into a new panel/account.
function useRequest(t) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controllers = useRef(new Set());
  const active = useRef(true);
  const generation = useRef(0);
  const foregroundPending = useRef(false);
  useEffect(() => {
    active.current = true;
    const pending = controllers.current;
    return () => {
      active.current = false;
      generation.current += 1;
      foregroundPending.current = false;
      pending.forEach((c) => c.abort());
      pending.clear();
    };
  }, []);
  const request = useCallback(async (path, options = {}, quiet = false) => {
    if (!quiet && foregroundPending.current) return null;
    if (!quiet) foregroundPending.current = true;
    const controller = new AbortController();
    const requestGeneration = generation.current;
    const isCurrent = () => active.current && generation.current === requestGeneration;
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 20000);
    if (!quiet) { setBusy(true); setError(""); }
    try {
      return await requestChatJson(apiFetch, path, options, {
        signal: controller.signal, quiet, isCurrent, onError: setError, translations: t,
      });
    } finally {
      clearTimeout(timer);
      controllers.current.delete(controller);
      if (isCurrent() && !quiet) {
        foregroundPending.current = false;
        setBusy(false);
      }
    }
  }, [t]);
  return { request, error, busy };
}

function ReferenceInput({ label, name = "reference", optional = false }) {
  return <label>{label}<input name={name} required={!optional} pattern={uuidPattern} maxLength={36} autoComplete="off" spellCheck={false} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>;
}

export function ApplicationTracking({ language, onSelect }) {
  const t = translations[language];
  const copy = trackingTranslations[language];
  const { request, busy, error } = useRequest(t);
  const [page, setPage] = useState(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let stopped = false;
    request("/api/chat/bids").then(data => { if (!stopped) setPage(data); });
    return () => { stopped = true; };
  }, [request]);
  async function load(term = query, start = offset) {
    if (busy) return;
    setPage(null);
    setQuery(term);
    setOffset(start);
    setPage(await request(`/api/chat/bids?${new URLSearchParams({ search: term, offset: start })}`));
  }
  async function select(bid) {
    if (busy) return;
    if (onSelect) { onSelect(bid); return; }
    setSelected(bid);
    setResult(null);
    setResult(await request("/api/chat/track", { method: "POST", body: JSON.stringify({ reference: bid.reference }) }));
  }
  return <div className="gemmy-tool gemmy-tracking" aria-busy={busy}>
    {selected ? <>
      <button type="button" className="gemmy-track-back" disabled={busy} onClick={() => { setSelected(null); setResult(null); load(); }}><ChevronLeft size={15} />{t.back}</button>
      <h3>{selected.tender_title}</h3>
      <p className="gemmy-reference">{copy.tender}: {selected.tender_id}</p>
      {result && <article className="gemmy-status-card" aria-live="polite">
        <span className={`gemmy-bid-status gemmy-bid-status-${result.status}`}>{t.statuses[result.status]}</span>
        <dl><dt>{t.submitted}</dt><dd>{formatDate(result.submitted_at, language)}</dd>
          <dt>{t.reviewed}</dt><dd>{formatDate(result.reviewed_at, language)}</dd></dl>
        <div className="gemmy-next-action"><strong>{t.next}</strong><p>{t.actions[result.next_action]}</p></div>
      </article>}
      <button type="button" disabled={busy} onClick={() => select(selected)}>{t.refresh}</button>
    </> : <>
      <h3>{copy.title}</h3><p className="gemmy-muted">{copy.intro}</p>
      <form className="gemmy-bid-search" onSubmit={event => { event.preventDefault(); load(search.trim(), 0); }}>
        <label className="gemmy-sr-only" htmlFor="gemmy-tender-search">{copy.search}</label>
        <input id="gemmy-tender-search" type="search" value={search} onChange={event => setSearch(event.target.value)} maxLength={255} placeholder={copy.search} />
        <button disabled={busy} aria-label={copy.search} title={copy.search}><Search size={17} /></button>
      </form>
      {page?.items.map(bid => <button type="button" className="gemmy-bid-card" key={bid.reference} disabled={busy} onClick={() => select(bid)}>
        <span className="gemmy-bid-card-heading"><FileSearch size={18} aria-hidden="true" /><strong>{bid.tender_title}</strong></span>
        <span className="gemmy-reference">{copy.tender}: {bid.tender_id}</span>
        <span className="gemmy-muted">{t.submitted}: {formatDate(bid.submitted_at, language)}</span>
        <span className="gemmy-bid-card-footer"><span className={`gemmy-bid-status gemmy-bid-status-${bid.status}`}>{t.statuses[bid.status]}</span><ArrowRight size={16} aria-label={copy.choose} /></span>
      </button>)}
      {page?.items.length === 0 && <p className="gemmy-bid-empty" role="status"><FileSearch size={26} aria-hidden="true" />{query || offset ? copy.noMatch : copy.empty}</p>}
      <div className="gemmy-bid-pagination">
        <button type="button" disabled={busy} onClick={() => load()}>{t.refresh}</button>
        {offset > 0 && <button type="button" disabled={busy} onClick={() => load(query, Math.max(0, offset - 20))}>{t.previous}</button>}
        {page?.has_more && <button type="button" disabled={busy} onClick={() => load(query, offset + 20)}>{t.more}</button>}
      </div>
    </>}
    {busy && <p role="status">{t.loading}</p>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function SupportPanel({ mode, language }) {
  const t = translations[language];
  const { request, busy, error } = useRequest(t);
  const [ticket, setTicket] = useState(null);
  const [available, setAvailable] = useState(null);
  const [relatedBid, setRelatedBid] = useState(null);
  const [choosingBid, setChoosingBid] = useState(false);
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
        <input type="hidden" name="reference" value={relatedBid?.reference || ""} />
        <button type="button" aria-expanded={choosingBid} onClick={() => setChoosingBid(value => !value)}>{trackingTranslations[language].optional}{relatedBid ? `: ${relatedBid.tender_title} · ${relatedBid.tender_id}` : ""}</button>
        {relatedBid && <button type="button" onClick={() => setRelatedBid(null)}>{trackingTranslations[language].clear}</button>}
        <p className="gemmy-muted">{t.consent}</p>
      </>}
      <button disabled={busy}>{busy ? t.loading : mode === "ticket" ? t.lookup : t.createTicket}</button>
    </form>
    {choosingBid && <ApplicationTracking language={language} onSelect={bid => { setRelatedBid(bid); setChoosingBid(false); }} />}
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
