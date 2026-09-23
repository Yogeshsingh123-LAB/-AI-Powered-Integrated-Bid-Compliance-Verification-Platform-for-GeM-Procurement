import { apiFetch, websocketUrl, isDemoMode } from "../services/api";
import { websocketToken } from "../services/api";
import { showToast } from "../services/toast";
import { getSessionToken } from "../services/session";
import React, { useState, useEffect, useRef } from 'react';
import { Radio, Zap, Inbox, AlertTriangle, ChevronRight } from 'lucide-react';
import './LiveBidMonitoring.css';

export default function LiveBidMonitoring({ tenderId = null }) {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    fetchRecentEvents();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [tenderId]);

  // Polling fallback: serverless hosts (Vercel) cannot hold persistent
  // WebSocket connections, so whenever the socket is not connected we poll
  // the REST recent-events endpoint every 10 seconds instead.
  useEffect(() => {
    if (isConnected) return; // live socket active — polling unnecessary
    if (isDemoMode()) return; // demo mode shows static sample events
    const iv = setInterval(async () => {
      try {
        const res = await apiFetch('/api/v1/monitoring/recent-events');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.events) && data.events.length > 0) {
            setEvents((prev) => {
              const seen = new Set(prev.map((e) => `${e.bid_id}|${e.timestamp}`));
              const fresh = data.events.filter((e) => !seen.has(`${e.bid_id}|${e.timestamp}`));
              return fresh.length ? [...fresh, ...prev].slice(0, 50) : prev;
            });
          }
        }
      } catch {
        /* transient network error — retry on the next tick */
      }
    }, 10000);
    return () => clearInterval(iv);
  }, [isConnected, tenderId]);

  const connectWebSocket = () => {
    if (isDemoMode()) return;
    const wsUrl = websocketUrl(tenderId
      ? `/api/v1/monitoring/tender/${encodeURIComponent(tenderId)}`
      : '/api/v1/monitoring/live');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        // Browsers cannot send cookies/headers on a socket handshake, so use a
        // short-lived ticket minted by GET /api/auth/ws-token (falls back to
        // the in-memory session token if the ticket endpoint is unreachable).
        const ticket = await websocketToken().catch(() => getSessionToken());
        ws.send(JSON.stringify({ token: ticket }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "authenticated") { setIsConnected(true); return; }
          setEvents((prev) => [data, ...prev.slice(0, 49)]);
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      setIsConnected(false);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const res = await apiFetch('/api/v1/monitoring/recent-events');
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          setEvents(getInitialDemoEvents());
        }
      } else {
        setEvents(getInitialDemoEvents());
      }
    } catch (e) {
      setEvents(getInitialDemoEvents());
    }
  };

  const getInitialDemoEvents = () => [
    {
      event_type: "BID_EVALUATION_COMPLETED",
      timestamp: new Date().toISOString(),
      tender_id: "TENDER-2026-091",
      bid_id: "BID-9912",
      bidder_name: "Apex Infra Solution Ltd",
      compliance_score: 95,
      risk_level: "LOW",
      alerts: [],
      score_breakdown: { document_completeness: "30/30", database_verification: "40/40" }
    },
    {
      event_type: "BID_EVALUATION_COMPLETED",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      tender_id: "TENDER-2026-091",
      bid_id: "BID-9913",
      bidder_name: "Global Reseller Corp",
      compliance_score: 45,
      risk_level: "HIGH",
      alerts: [
        { severity: "CRITICAL", title: "Non-Compliant Bid Submission", message: "Compliance score of only 45/100." },
        { severity: "CRITICAL", title: "Blacklisted Vendor Submission", message: "Vendor is blacklisted in Tax registry." }
      ],
      score_breakdown: { document_completeness: "15/30", database_verification: "10/40" }
    }
  ];

  const handleSimulateBid = async (isNonCompliant = false) => {
    setSimulating(true);
    try {
      await apiFetch('/api/v1/monitoring/simulate-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_id: tenderId || "TENDER-2026-LIVE",
          bidder_name: isNonCompliant ? "Non-Compliant Demo Entity" : "Compliant Tech Solutions",
          score: isNonCompliant ? 42 : 92,
          include_forgery_alert: isNonCompliant,
          include_cartel_alert: isNonCompliant
        })
      });
    } catch (err) {
      showToast("Simulated event broadcasted (demo sandbox).", "info");
    } finally {
      setSimulating(false);
    }
  };

  const criticalAlerts = events.flatMap((e) => e.alerts || []).filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Radio size={22} style={{ color: '#ef4444' }} /> Real-Time Bid Monitoring & Live Feed</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {tenderId ? `Tender Channel: ${tenderId}` : "Global Procurement Stream"}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`ws-status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="pulse-dot"></span>
            {isConnected ? "LIVE WEBSOCKET CONNECTED" : "WEBSOCKET DISCONNECTED (POLLING)"}
          </span>

          <button className="sim-btn" onClick={() => handleSimulateBid(true)} disabled={simulating} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} /> Simulate Non-Compliant Bid Alert
          </button>
        </div>
      </div>

      <div className="monitoring-grid">
        {/* Left Column: Live Ticker Feed */}
        <div>
          <h3 style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: 0, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Inbox size={16} /> Live Incoming Bid Evaluation Stream ({events.length})
          </h3>

          <div className="live-feed-panel">
            {events.map((ev, idx) => {
              const isAlert = ev.alerts && ev.alerts.length > 0;
              const hasCrit = ev.alerts?.some((a) => a.severity === 'CRITICAL');
              return (
                <div
                  key={idx}
                  className={`bid-event-card ${hasCrit ? 'alert-critical' : isAlert ? 'alert-high' : ''}`}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{ev.bidder_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Tender: <strong>{ev.tender_id}</strong> • Bid ID: {ev.bid_id} • {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        color: ev.compliance_score >= 70 ? '#34d399' : ev.compliance_score >= 50 ? '#fbbf24' : '#f87171'
                      }}
                    >
                      {ev.compliance_score}/100
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: ev.risk_level === 'LOW' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: ev.risk_level === 'LOW' ? '#34d399' : '#fca5a5'
                      }}
                    >
                      {ev.risk_level} RISK
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Non-Compliant Alerts Drawer */}
        <div className="alerts-drawer">
          <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Active Compliance Alerts ({criticalAlerts.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
            {criticalAlerts.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>
                Zero active compliance breach alerts.
              </div>
            ) : (
              criticalAlerts.map((alt, i) => (
                <div key={i} className={`alert-item-card ${alt.severity.toLowerCase()}`}>
                  <div style={{ fontWeight: '700', color: alt.severity === 'CRITICAL' ? '#fca5a5' : '#fcd34d', marginBottom: '0.2rem' }}>
                    [{alt.severity}] {alt.title}
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{alt.message}</div>
                  {alt.action_required && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ChevronRight size={12} /> Action: {alt.action_required}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
