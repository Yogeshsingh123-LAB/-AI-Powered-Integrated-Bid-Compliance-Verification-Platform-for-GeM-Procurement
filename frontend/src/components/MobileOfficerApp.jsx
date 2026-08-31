import React, { useState, useEffect } from 'react';
import './MobileOfficerApp.css';

export default function MobileOfficerApp() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeToast, setActiveToast] = useState(null);
  const [processedLog, setProcessedLog] = useState([]);

  useEffect(() => {
    fetchMobileCards();
  }, []);

  const fetchMobileCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/mobile/pending-bids');
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards);
      } else {
        setMockCards();
      }
    } catch (err) {
      setMockCards();
    } finally {
      setLoading(false);
    }
  };

  const setMockCards = () => {
    setCards([
      {
        bid_id: "123e4567-e89b-12d3-a456-426614174000",
        tender_id: "TENDER-2026-88",
        tender_title: "Procurement of High-Capacity Server Racks",
        bidder_name: "Apex Infra Solution Ltd",
        compliance_score: 92,
        urgency: "HIGH",
        submitted_at: "10 min ago",
        key_highlights: ["OEM Authorization valid", "Turnover > ₹5 Cr", "Clean Blacklist Record"]
      },
      {
        bid_id: "223e4567-e89b-12d3-a456-426614174001",
        tender_id: "TENDER-2026-89",
        tender_title: "Annual Maintenance for Data Center HVAC",
        bidder_name: "CyberTech Global Pvt Ltd",
        compliance_score: 45,
        urgency: "CRITICAL",
        submitted_at: "25 min ago",
        key_highlights: ["⚠️ Compliance Score Below 50", "EMD Exemption Claimed", "PDF Tampering Warning"]
      }
    ]);
  };

  const handleQuickAction = async (bidId, action) => {
    try {
      await fetch('/api/v1/mobile/quick-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId, action: action })
      });
    } catch (e) {
      // Mock fallback
    }

    const card = cards.find(c => c.bid_id === bidId);
    setProcessedLog(prev => [{ ...card, action_taken: action, timestamp: new Date().toLocaleTimeString() }, ...prev]);
    setCards(prev => prev.filter(c => c.bid_id !== bidId));
  };

  const handleSimulatePushAlert = async () => {
    try {
      const res = await fetch('/api/v1/mobile/send-test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bid_id: "BID-URGENT-99",
          tender_title: "Emergency Oxygen Concentrators",
          bidder_name: "MedTech Infra Ltd"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveToast(data.payload);
      } else {
        triggerMockPushToast();
      }
    } catch (e) {
      triggerMockPushToast();
    }
  };

  const triggerMockPushToast = () => {
    setActiveToast({
      title: "🚨 URGENT BID: CRITICAL Review Required",
      body: "MedTech Infra Ltd submitted a bid for 'Emergency Oxygen Concentrators'. Touch to review.",
      sent_at: "Just now"
    });
  };

  return (
    <div className="mobile-viewport-container">
      <div className="mobile-phone-frame">
        {/* Status Bar */}
        <div className="mobile-status-bar">
          <span>9:41 📱</span>
          <span>GeM Mobile Officer • 5G</span>
          <span>🔋 98%</span>
        </div>

        {/* Lockscreen Web Push Toast Banner */}
        {activeToast && (
          <div className="push-notification-toast">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <strong style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{activeToast.title}</strong>
              <button 
                onClick={() => setActiveToast(null)} 
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              {activeToast.body}
            </p>
          </div>
        )}

        {/* App Header */}
        <div className="mobile-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>📱 Officer Mobile Console</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>GeM Quick Approval Engine</span>
          </div>

          <button 
            onClick={handleSimulatePushAlert} 
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🔔 Push Alert
          </button>
        </div>

        {/* App Content */}
        <div className="mobile-content-area">
          {activeTab === "inbox" && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Pending Reviews ({cards.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#34d399' }}>⚡ 1-Tap Quick Action</span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Loading mobile bid cards...
                </div>
              ) : cards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#34d399' }}>
                  🎉 All pending bids reviewed! Mobile inbox clear.
                </div>
              ) : (
                cards.map((card) => (
                  <div key={card.bid_id} className="bid-swipe-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{card.bidder_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{card.tender_title}</div>
                      </div>

                      <span className={`score-badge ${card.compliance_score >= 50 ? 'score-high' : 'score-low'}`}>
                        Score: {card.compliance_score}/100
                      </span>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Highlights:</span>
                      <ul style={{ margin: '0.3rem 0 0 1rem', padding: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                        {card.key_highlights?.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="quick-action-button-group">
                      <button 
                        className="btn-quick-reject"
                        onClick={() => handleQuickAction(card.bid_id, "REJECT")}
                      >
                        ❌ Quick Reject
                      </button>
                      <button 
                        className="btn-quick-approve"
                        onClick={() => handleQuickAction(card.bid_id, "APPROVE")}
                      >
                        ✅ Quick Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "history" && (
            <div>
              <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                Recent Mobile Quick Decisions ({processedLog.length})
              </h4>
              {processedLog.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '2rem' }}>
                  No decisions taken in this session yet.
                </div>
              ) : (
                processedLog.map((log, i) => (
                  <div key={i} style={{ background: 'rgba(30,41,59,0.5)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: `3px solid ${log.action_taken === 'APPROVE' ? '#34d399' : '#f87171'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700' }}>
                      <span>{log.bidder_name}</span>
                      <span style={{ color: log.action_taken === 'APPROVE' ? '#34d399' : '#f87171' }}>{log.action_taken}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {log.tender_title} • {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="mobile-bottom-nav">
          <div 
            className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <span>📬</span>
            <span>Inbox ({cards.length})</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span>📜</span>
            <span>History ({processedLog.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
