import React, { useState } from 'react';
import { 
  CheckCircle, AlertTriangle, XCircle, ShieldCheck, FileText, ExternalLink, 
  RefreshCw, MessageSquare, ArrowLeft, Building, User, Calendar, Award, Info, Lock
} from 'lucide-react';
import { apiFetch } from '../services/api';

export default function BidderVerificationView({ bidData, onBack, isOfficer, onRefresh }) {
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationMsg, setClarificationMsg] = useState('Please upload a valid OEM Authorization certificate issued by the equipment manufacturer.');
  const [decisionModal, setDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('QUALIFIED');
  const [decisionJustification, setDecisionJustification] = useState('All statutory documents and OEM Authorization verified. Bidder meets all technical requirements.');
  const [actionLoading, setActionLoading] = useState(false);

  const score = bidData?.compliance_score ?? bidData?.score ?? 86;
  const risk = bidData?.risk_level ?? bidData?.risk ?? 'MEDIUM';
  const status = bidData?.officer_status || bidData?.status || 'UNDER REVIEW';

  // Requirements checklist fallback
  const requirementsList = [
    { code: 'PAN', name: 'PAN Card Verification', status: 'VERIFIED', risk: 'LOW', source: 'INCOME-TAX-IN-MOCK', extracted: 'AAPCS1234M (Acme Tech Solutions Pvt Ltd)', registry: 'AAPCS1234M - ACTIVE (Acme Tech Solutions Private Limited)', match: 'MATCH (100%)', timestamp: '2026-09-11 10:32:00 Z', explanation: 'Extracted PAN matched Income Tax registry active record with 100% legal name alignment.' },
    { code: 'GST', name: 'GSTIN Registration', status: 'VERIFIED', risk: 'LOW', source: 'GSTN-MOCK', extracted: '27AAPCS1234M1Z5 (Acme Tech Solutions Pvt Ltd)', registry: '27AAPCS1234M1Z5 - ACTIVE (Acme Tech Solutions Pvt Ltd)', match: 'MATCH (100%)', timestamp: '2026-09-11 10:32:05 Z', explanation: 'GSTIN active in GSTN portal, 12 GSTR returns filed continuously.' },
    { code: 'UDYAM', name: 'Udyam MSME Registration', status: 'VERIFIED', risk: 'LOW', source: 'UDYAM-MSME-MOCK', extracted: 'UDYAM-MH-12-0012345', registry: 'UDYAM-MH-12-0012345 - Micro Enterprise (Active)', match: 'MATCH (100%)', timestamp: '2026-09-11 10:32:10 Z', explanation: 'Valid MSME certificate. Eligible for EMD exemption.' },
    { code: 'INCOME_TAX', name: 'Income Tax Return Compliance', status: 'VERIFIED', risk: 'LOW', source: 'INCOME-TAX-E-FILING-MOCK', extracted: 'ITR-V FY 2023-24, FY 2024-25, FY 2025-26', registry: 'E-filing Portal Verified', match: 'MATCH', timestamp: '2026-09-11 10:32:15 Z', explanation: 'Income tax returns filed consistently for last 3 financial years.' },
    { code: 'EPFO', name: 'EPFO Compliance', status: 'NEEDS_REVIEW', risk: 'MEDIUM', source: 'EPFO-MOCK', extracted: 'EPFO ID: MH/BAN/0045123/000', registry: 'EPFO ID: MH/BAN/0045123/000 (Legal Name: ABC Infrastructure and Tech Services)', match: 'NAME VARIATION WARNING', timestamp: '2026-09-11 10:33:00 Z', explanation: 'EPFO registration active, but employer legal name shows minor variation. Officer review recommended.' },
    { code: 'ESIC', name: 'ESIC Compliance', status: 'VERIFIED', risk: 'LOW', source: 'ESIC-MOCK', extracted: 'ESIC Employer Code: 31000451230000101', registry: 'ESIC Active (35 Covered Employees)', match: 'MATCH', timestamp: '2026-09-11 10:33:10 Z', explanation: 'Employer code verified with 35 covered employees.' },
    { code: 'OEM_AUTH', name: 'OEM Authorization (MAF)', status: bidData?.has_oem ? 'VERIFIED' : 'MISSING', risk: bidData?.has_oem ? 'LOW' : 'HIGH', source: 'OEM-VERIFIER-MOCK', extracted: bidData?.has_oem ? 'Valid OEM Authorization Form for Server Rack Models' : 'Not Uploaded', registry: bidData?.has_oem ? 'Verified OEM Partner' : 'No OEM Certificate Found', match: bidData?.has_oem ? 'MATCH' : 'MISSING', timestamp: '2026-09-11 10:33:15 Z', explanation: bidData?.has_oem ? 'Valid OEM authorization uploaded and verified.' : 'OEM Authorization certificate is missing from the bid submission package.' },
    { code: 'MAKE_IN_INDIA', name: 'Make in India Declaration', status: 'VERIFIED', risk: 'LOW', source: 'DECLARATION-AI-EXTRACTOR', extracted: 'Local Content: 65% (Class-I Local Supplier)', registry: 'Verified Declaration Format', match: 'MATCH', timestamp: '2026-09-11 10:33:20 Z', explanation: 'Bidder declares 65% local content, exceeding the mandatory 50% threshold.' },
    { code: 'BLACKLIST', name: 'Blacklisting / Debarment', status: 'VERIFIED', risk: 'LOW', source: 'CENTRAL-DEBARMENT-REGISTRY-MOCK', extracted: 'PAN: AAPCS1234M / GSTIN: 27AAPCS1234M1Z5', registry: 'NOT BLACKLISTED', match: 'CLEAR', timestamp: '2026-09-11 10:33:25 Z', explanation: 'No debarment or blacklisting orders found in Central Debarment Database.' }
  ];

  const handleRequestClarificationSubmit = async () => {
    if (!selectedRequirement) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/bids/${bidData.id}/request-clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: selectedRequirement.code,
          requirement_name: selectedRequirement.name,
          message: clarificationMsg
        })
      });
      if (res.ok) {
        setShowClarificationModal(false);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfficerDecisionSubmit = async () => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/bids/${bidData.id}/officer-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          justification: decisionJustification
        })
      });
      if (res.ok) {
        setDecisionModal(false);
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReVerifyTrigger = async () => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/bids/${bidData.id}/re-verify`, {
        method: 'POST'
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Bar with Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={onBack}
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isOfficer && (
            <>
              <button 
                onClick={handleReVerifyTrigger}
                disabled={actionLoading}
                style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} /> Run Re-Verification
              </button>
              <button 
                onClick={() => setDecisionModal(true)}
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                <ShieldCheck size={16} /> Render Final Decision
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #334155', borderRadius: '14px', padding: '24px', marginBottom: '28px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Bidder Compliance Profile
          </span>
          <h1 style={{ margin: '4px 0 6px', fontSize: '1.5rem', color: '#f8fafc' }}>
            {bidData?.bidder_name || bidData?.bidderName || 'Acme Tech Solutions Private Limited'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
            Tender: {bidData?.tender_title || 'Supply, Installation & Maintenance of Server Infrastructure'}
          </p>
        </div>

        {/* Compliance Score Dial */}
        <div style={{ textAlign: 'center', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', padding: '0 16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Compliance Score</span>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: score >= 90 ? '#4ade80' : score >= 75 ? '#fde047' : '#fca5a5', lineHeight: 1.1, marginTop: '4px' }}>
            {score} <span style={{ fontSize: '1.1rem', color: '#64748b' }}>/ 100</span>
          </div>
        </div>

        {/* Risk & Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '8px' }}>Risk Level:</span>
            <span style={{ 
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
              background: risk === 'LOW' ? 'rgba(34, 197, 94, 0.2)' : risk === 'MEDIUM' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: risk === 'LOW' ? '#4ade80' : risk === 'MEDIUM' ? '#fde047' : '#fca5a5',
              border: `1px solid ${risk === 'LOW' ? '#22c55e' : risk === 'MEDIUM' ? '#eab308' : '#ef4444'}`
            }}>
              {risk} RISK
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '8px' }}>Status:</span>
            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, background: '#1e293b', color: '#38bdf8', border: '1px solid #0284c7' }}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div style={{ background: 'rgba(2, 132, 199, 0.12)', border: '1px solid #0284c7', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <Info style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} size={22} />
        <div>
          <strong style={{ color: '#38bdf8', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
            AI Decision Support Insights
          </strong>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.5 }}>
            {score >= 90 
              ? "Bidder appears fully compliant across all statutory databases (GST, PAN, Udyam, EPFO, ESIC, Blacklisting). Procurement Officer Review Required for final sign-off."
              : "Bidder appears substantially compliant (86/100) but requires OEM Authorization verification and minor clarification regarding EPFO employer name before final qualification. Procurement Officer Review Required."}
          </p>
        </div>
      </div>

      {/* Requirement Verification Grid */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#f8fafc' }}>
        Statutory Document Verification Checklist
      </h3>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
        {requirementsList.map((req) => {
          const isPass = req.status === 'VERIFIED';
          const isReview = req.status === 'NEEDS_REVIEW';
          const isFail = req.status === 'MISSING' || req.status === 'FAILED';

          return (
            <div 
              key={req.code}
              onClick={() => setSelectedRequirement(req)}
              style={{ 
                background: '#1e293b', border: `1px solid ${isPass ? '#334155' : isReview ? '#eab308' : '#ef4444'}`, 
                borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {isPass && <CheckCircle style={{ color: '#22c55e' }} size={22} />}
                {isReview && <AlertTriangle style={{ color: '#eab308' }} size={22} />}
                {isFail && <XCircle style={{ color: '#ef4444' }} size={22} />}
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#f8fafc' }}>{req.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Source: {req.source}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ 
                  fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
                  background: isPass ? 'rgba(34, 197, 94, 0.15)' : isReview ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isPass ? '#4ade80' : isReview ? '#fde047' : '#fca5a5'
                }}>
                  {isPass ? '✓ VERIFIED' : isReview ? '⚠ NEEDS REVIEW' : '❌ MISSING / FAILED'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'underline' }}>View Evidence →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requirement Evidence Modal */}
      {selectedRequirement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '650px', padding: '24px', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{selectedRequirement.name} Evidence</h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Source: {selectedRequirement.source}</span>
              </div>
              <button onClick={() => setSelectedRequirement(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '12px', fontSize: '0.875rem', marginBottom: '20px' }}>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8', display: 'block' }}>Extracted Document Data:</strong>
                <code style={{ color: '#cbd5e1' }}>{selectedRequirement.extracted}</code>
              </div>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8', display: 'block' }}>Government Portal Registry Data:</strong>
                <code style={{ color: '#cbd5e1' }}>{selectedRequirement.registry}</code>
              </div>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8', display: 'block' }}>Comparison Status:</strong>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{selectedRequirement.match}</span>
              </div>
              <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ color: '#38bdf8', display: 'block' }}>AI Verification Analysis:</strong>
                <p style={{ margin: '4px 0 0', color: '#cbd5e1', lineHeight: 1.4 }}>{selectedRequirement.explanation}</p>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Verified at: {selectedRequirement.timestamp} | Confidence: 98.4%
              </div>
            </div>

            {isOfficer && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                <button 
                  onClick={() => {
                    setShowClarificationModal(true);
                  }}
                  style={{ background: '#eab308', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} /> Request Clarification
                </button>
                <button 
                  onClick={() => setSelectedRequirement(null)}
                  style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  Approve Requirement
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clarification Request Modal */}
      {showClarificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '550px', padding: '24px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 12px', color: '#f8fafc' }}>Request Requirement Clarification</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              Send an official GeM clarification request to the bidder regarding <strong>{selectedRequirement?.name}</strong>.
            </p>
            <textarea 
              rows={4}
              value={clarificationMsg}
              onChange={e => setClarificationMsg(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.875rem', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowClarificationModal(false)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={handleRequestClarificationSubmit}
                disabled={actionLoading}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                {actionLoading ? 'Sending...' : 'Send Clarification Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Officer Decision Modal */}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', width: '100%', maxWidth: '550px', padding: '24px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 12px', color: '#f8fafc' }}>Render Procurement Officer Qualification Decision</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              Core Rule: The AI does not qualify or disqualify bidders. As Procurement Officer, your decision is final and recorded in the immutable audit log.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button 
                onClick={() => setDecisionType('QUALIFIED')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: decisionType === 'QUALIFIED' ? '2px solid #22c55e' : '1px solid #334155', background: decisionType === 'QUALIFIED' ? 'rgba(34, 197, 94, 0.2)' : '#1e293b', color: decisionType === 'QUALIFIED' ? '#4ade80' : '#cbd5e1', fontWeight: 700, cursor: 'pointer' }}
              >
                QUALIFY BIDDER
              </button>
              <button 
                onClick={() => setDecisionType('DISQUALIFIED')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: decisionType === 'DISQUALIFIED' ? '2px solid #ef4444' : '1px solid #334155', background: decisionType === 'DISQUALIFIED' ? 'rgba(239, 68, 68, 0.2)' : '#1e293b', color: decisionType === 'DISQUALIFIED' ? '#fca5a5' : '#cbd5e1', fontWeight: 700, cursor: 'pointer' }}
              >
                DISQUALIFY BIDDER
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Decision Justification & Evidence Summary *</label>
            <textarea 
              rows={4}
              value={decisionJustification}
              onChange={e => setDecisionJustification(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.875rem', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setDecisionModal(false)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                onClick={handleOfficerDecisionSubmit}
                disabled={actionLoading}
                style={{ background: decisionType === 'QUALIFIED' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                {actionLoading ? 'Recording...' : `Confirm ${decisionType}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
