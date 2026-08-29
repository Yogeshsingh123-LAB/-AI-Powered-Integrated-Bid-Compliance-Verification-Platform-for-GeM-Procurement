import { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  FileCheck2
} from "lucide-react";

function StatusPage({ bids, onSelectBid }) {
  const [expandedBidId, setExpandedBidId] = useState(null);

  const toggleExpand = (bidId) => {
    if (expandedBidId === bidId) {
      setExpandedBidId(null);
    } else {
      setExpandedBidId(bidId);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "verified":
        return <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />;
      case "under review":
        return <Clock size={18} style={{ color: 'var(--warning)' }} />;
      case "rejected":
        return <XCircle size={18} style={{ color: 'var(--danger)' }} />;
      default:
        return <HelpCircle size={18} style={{ color: 'var(--info)' }} />;
    }
  };

  return (
    <>
      <h1>Compliance Tracking Milestones</h1>
      <p className="subtitle">
        Monitor the current status and detailed verification milestones for your submitted bid compliance applications.
      </p>

      <div className="section-panel" style={{ padding: '24px 0' }}>
        <div className="status-list" style={{ display: 'flex', flexDirection: 'column' }}>
          {bids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <FileCheck2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
              <h3 style={{ color: 'var(--text-h)', marginBottom: '8px', fontSize: '1.1rem' }}>No bids submitted yet</h3>
              <p style={{ fontSize: '0.875rem' }}>Upload your first bid document in the Verification tab to see compliance tracking.</p>
            </div>
          ) : (
            bids.map((bid) => {
              const isExpanded = expandedBidId === bid.id;
              
              // Build simple milestone stages based on status
              const milestones = [
                { name: "Document Uploaded", desc: `PDF file parsed via SmartPDFHandler`, state: "completed" },
                { 
                  name: "Identifier Extraction", 
                  desc: bid.gstin || bid.pan || bid.udyam 
                    ? `GST/PAN/Udyam identifiers successfully mapped` 
                    : `Waiting for identifier regex matching`,
                  state: bid.gstin || bid.pan || bid.udyam ? "completed" : "active"
                },
                { 
                  name: "Registry Validation", 
                  desc: bid.score >= 50 ? `Active records found in Gov Database` : `Warnings: Mismatches or invalid records found`,
                  state: bid.score >= 50 ? "completed" : bid.score > 0 ? "active" : "pending"
                },
                { 
                  name: "Auditor Sign-Off", 
                  desc: bid.status === "Verified" 
                    ? `Audited and Approved by officer` 
                    : bid.status === "Rejected" 
                    ? `Audit rejected: Revision requested` 
                    : `Awaiting auditor review and sign-off`,
                  state: bid.status === "Verified" ? "completed" : bid.status === "Rejected" ? "failed" : "active"
                }
              ];

              return (
                <div 
                  key={bid.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    padding: '16px 24px',
                    background: isExpanded ? 'rgba(255,255,255,0.01)' : 'transparent'
                  }}
                >
                  {/* Header Row */}
                  <div 
                    className="status-item-header"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleExpand(bid.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {getStatusIcon(bid.status)}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-h)' }}>
                          {bid.id} — {bid.bidderName}
                        </strong>
                        <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          Submitted On: {bid.submittedOn} | Risk Score: <code style={{ fontSize: '0.75rem', padding: '1px 4px' }}>{bid.score}/100</code>
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className={`status-badge ${bid.status.toLowerCase().replace(" ", "")}`}>
                        {bid.status}
                      </span>
                      {isExpanded ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#64748b' }} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '24px', paddingLeft: '34px', animation: 'fadeIn 0.2s ease-out' }}>
                      <div className="status-grid" style={{ display: 'grid', gap: '24px' }}>
                        
                        {/* Milestones Map */}
                        <div>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                            Milestone Stages Progress
                          </h4>
                          <div className="milestones-container">
                            {milestones.map((m, idx) => (
                              <div 
                                key={idx} 
                                className={`milestone-step ${m.state}`}
                                style={{ 
                                  opacity: m.state === "pending" ? 0.4 : 1 
                                }}
                              >
                                <span className="milestone-dot"></span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <h3>{m.name}</h3>
                                  <span className={`milestone-badge ${m.state}`}>{m.state}</span>
                                </div>
                                <p>{m.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary Widget */}
                        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
                          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-h)' }}>Compliance Health</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`risk-badge ${bid.risk.toLowerCase()}`}>
                              {bid.risk} RISK
                            </span>
                            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--mono)', fontWeight: '700', color: 'var(--text-h)' }}>
                              {bid.score}%
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Registry validations are calculated from active certificates and name matches.
                          </p>
                          <button 
                            type="button" 
                            className="action-btn"
                            style={{ fontSize: '0.75rem', padding: '10px 12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}
                            onClick={() => {
                              if (onSelectBid) onSelectBid(bid);
                            }}
                          >
                            <FileCheck2 size={12} />
                            <span>View Inspection Details</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default StatusPage;