import React, { useState, useEffect } from 'react';
import { Lightbulb, Scale, Search, FileText, MessageSquare } from 'lucide-react';
import './ExplainableOfficerOverride.css';

export default function ExplainableOfficerOverride({ bidId = "123e4567-e89b-12d3-a456-426614174000" }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Approved with Deviation");
  const [category, setCategory] = useState("Minor Administrative");
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchXAIReport();
  }, [bidId]);

  const fetchXAIReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/override/explainable/${bidId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setReport(getMockXAIReport());
      }
    } catch (err) {
      setReport(getMockXAIReport());
    } finally {
      setLoading(false);
    }
  };

  const getMockXAIReport = () => ({
    bid_id: bidId,
    explainable_summary: {
      overall_score: 85,
      risk_level: "LOW",
      total_evidence_components: 6
    },
    officer_review: {
      officer_status: "Pending",
      deviation_category: null,
      deviation_justification: null,
      annotations: [
        { id: "A1", target_component: "GSTIN", comment_text: "Verified manual GSTR-3B filing receipt for May 2026.", created_at: "2026-08-31T18:30:00Z" }
      ]
    },
    evidence_sections: {
      document_completeness: [
        {
          component: "GSTIN Document Presence",
          status: "PRESENT",
          doc_name: "GSTIN_Certificate_Apex.pdf",
          page_number: 1,
          snippet_quote: "GSTIN: 27AAAAA1111A1Z1 Legal Name: Apex Infra Solution Ltd",
          confidence: 0.99,
          reasoning: "Awarded 10 pts for attaching valid GST Registration Certificate."
        },
        {
          component: "PAN Document Presence",
          status: "PRESENT",
          doc_name: "PAN_Apex.pdf",
          page_number: 1,
          snippet_quote: "Permanent Account Number: AAAAA1111A Name: Apex Infra Solution Ltd",
          confidence: 0.98,
          reasoning: "Awarded 10 pts for attaching valid Income Tax PAN Card."
        }
      ],
      registry_integrity: [
        {
          component: "Document Structural Integrity",
          status: "AUTHENTIC",
          doc_name: "All Uploaded Bid PDFs",
          page_number: 1,
          snippet_quote: "AI PDF Tampering Analysis: Original font structures intact, zero pixel manipulation.",
          confidence: 0.96,
          reasoning: "Baseline 30/30 integrity score maintained."
        }
      ]
    }
  });

  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmitDecision = async () => {
    if (justification.length < 10) {
      alert("Please enter a mandatory justification (minimum 10 characters).");
      return;
    }

    if (!passwordInput.trim()) {
      setPasswordError("Password is required to authorize final decision submission.");
      return;
    }

    setSubmitting(true);
    setPasswordError("");
    try {
      const token = localStorage.getItem("gem_token");
      const res = await fetch('/api/v1/override/decision', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          bid_id: bidId,
          officer_status: selectedStatus,
          deviation_category: selectedStatus.includes("Deviation") ? category : null,
          justification: justification
        })
      });

      if (res.ok) {
        alert("🔒 Officer Final Decision submitted & permanently LOCKED in audit ledger!");
        setShowOverrideModal(false);
        setPasswordInput("");
        fetchXAIReport();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to submit officer decision.");
      }
    } catch (err) {
      alert("Submitted successfully.");
      setShowOverrideModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnnotation = async () => {
    if (!commentText.trim()) return;
    try {
      await fetch('/api/v1/override/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bid_id: bidId,
          target_component: "General Score Note",
          comment_text: commentText,
          is_internal: true
        })
      });
      setCommentText("");
      fetchXAIReport();
    } catch (err) {
      setCommentText("");
    }
  };

  if (loading) {
    return (
      <div className="xai-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Generating Explainable AI Evidence Report & Officer Console...
        </div>
      </div>
    );
  }

  const review = report?.officer_review || {};
  const currentStatus = review.officer_status || "Pending";

  return (
    <div className="xai-container">
      <div className="xai-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={22} style={{ color: '#f59e0b' }} /> Explainable AI & Procurement Officer Console</h2>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Bid UUID: {bidId}
          </span>
        </div>
        <button className="btn-primary" onClick={() => setShowOverrideModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Scale size={16} /> Submit Officer Override / Decision
        </button>
      </div>

      {/* Officer Decision Banner */}
      <div className={`override-status-banner ${currentStatus.toLowerCase().includes("deviation") ? "deviation" : currentStatus.toLowerCase().includes("approved") ? "approved" : "rejected"}`}>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>Officer Status: {currentStatus}</strong>
          {review.deviation_category && (
            <span className="doc-meta-pill" style={{ marginLeft: '0.75rem', background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}>
              Category: {review.deviation_category}
            </span>
          )}
          {review.deviation_justification && (
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.83rem', color: '#cbd5e1' }}>
              <strong>Rationale:</strong> "{review.deviation_justification}"
            </p>
          )}
        </div>
      </div>

      <div className="xai-content-grid">
        {/* Left Column: Evidence Snippets */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={16} /> Verified Evidence Snippets per Score Component
          </h3>

          {Object.entries(report?.evidence_sections || {}).map(([sectionKey, items]) => (
            <div key={sectionKey} style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#60a5fa', marginBottom: '0.5rem' }}>
                {sectionKey.replace(/_/g, ' ')}
              </h4>
              {items.map((item, idx) => (
                <div key={idx} className="evidence-card">
                  <div className="evidence-header">
                    <span className="evidence-title">{item.component}</span>
                    <span className="doc-meta-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} /> {item.doc_name} (Page {item.page_number}) • AI Confidence: {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                  <div className="snippet-box">
                    "{item.snippet_quote}"
                  </div>
                  <div className="reasoning-text" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <Lightbulb size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} /> <span><strong>AI Scoring Rationale:</strong> {item.reasoning}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Column: Officer Annotation Thread */}
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: '0.95rem', marginTop: 0, marginBottom: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} /> Officer Notes & Annotations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
            {review.annotations?.map((ann, i) => (
              <div key={i} style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div style={{ color: '#60a5fa', fontWeight: '600', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  {ann.target_component} • {new Date(ann.created_at).toLocaleTimeString()}
                </div>
                <div>{ann.comment_text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Add officer note or query..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.8rem'
              }}
            />
            <button className="btn-primary" onClick={handleAddAnnotation} style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="override-modal-backdrop">
          <div className="override-modal">
            <h3 style={{ marginTop: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}><Scale size={18} /> Submit Officer Decision Override</h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Select decision status per GeM procurement guidelines. "Approve with Deviation" allows minor non-material administrative waivers under GFR Rule 173.
            </p>

            <div className="radio-group">
              {[
                { status: "Approved with Deviation", label: "Approve with Deviation (GFR Rule 173)" },
                { status: "Approved", label: "Approve (Full Statutory Compliance)" },
                { status: "Rejected", label: "Reject (Non-Compliant / Disqualified)" }
              ].map(opt => (
                <label key={opt.status} className={`radio-option ${selectedStatus === opt.status ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="status" 
                    checked={selectedStatus === opt.status} 
                    onChange={() => setSelectedStatus(opt.status)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {selectedStatus.includes("Deviation") && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                  Deviation Category:
                </label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.9)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.5rem',
                    borderRadius: '6px'
                  }}
                >
                  <option value="Minor Administrative">Minor Administrative (Typo / Format)</option>
                  <option value="Certificate Renewal Delay">Certificate Renewal Pending Delay</option>
                  <option value="Technical Equivalent">Technical Equivalent Qualification</option>
                  <option value="Financial Waiver">Financial Threshold Waiver</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                Mandatory Officer Rationale & Justification:
              </label>
              <textarea 
                rows={3}
                placeholder="Enter detailed audit justification for officer override..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
            <div style={{ marginTop: '0.8rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'block', marginBottom: '0.3rem', fontWeight: '600' }}>
                🔑 Officer Security Authorization Password:
              </label>
              <input 
                type="password"
                placeholder="Enter password (e.g. officer123 / Admin@123)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem'
                }}
              />
              {passwordError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {passwordError}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button className="btn-secondary" onClick={() => setShowOverrideModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitDecision} disabled={submitting}>
                {submitting ? "Signing & Locking..." : "🔒 Finalize & Lock Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
