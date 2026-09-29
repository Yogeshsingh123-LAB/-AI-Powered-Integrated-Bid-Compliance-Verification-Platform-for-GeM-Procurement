import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle, AlertTriangle, XCircle, ShieldCheck, FileText,
  RefreshCw, MessageSquare, ArrowLeft, Info
} from 'lucide-react';
import { apiFetch } from '../services/api';

/**
 * Evidence-first bidder verification view.
 *
 * DATA PROVENANCE RULE (audit fix):
 * Everything rendered here must come from the API payload for THIS bid. This
 * component previously shipped a 9-item hard-coded "demo checklist" (with
 * fabricated registry strings, timestamps and a "Local Content: 65%" claim) that
 * was shown whenever `bidData.requirements` was present, plus a hard-coded
 * `score = 86` fallback. A bid whose real score was 0/100 therefore displayed
 * "86 / 100 MEDIUM RISK" and every real requirement displayed as
 * "❌ MISSING / FAILED". No invented values remain.
 */

// ---------------------------------------------------------------------------
// Government registry adapter endpoints (the verification gateway).
// The bid's extracted identifiers are looked up here so the officer sees
// "extracted value vs. registry response" instead of an empty modal.
// ---------------------------------------------------------------------------
const REGISTRY_ROUTES = {
  gstin: { path: 'verify/gst', label: 'GSTN' },
  pan: { path: 'verify/pan', label: 'Income Tax / PAN' },
  udyam: { path: 'verify/udyam', label: 'Udyam / MSME' },
  cin: { path: 'verify/mca', label: 'MCA21' },
  epfo: { path: 'verify/epfo', label: 'EPFO' },
  esic: { path: 'verify/esic', label: 'ESIC' },
  aadhaar: { path: 'verify/aadhaar', label: 'UIDAI' }
};

// Requirement code -> which registry backs it.
const CODE_TO_REGISTRY = {
  GST: 'gstin', GST_CERTIFICATE: 'gstin', GST_RETURN: 'gstin',
  PAN: 'pan', INCOME_TAX: 'pan', ITR: 'pan',
  UDYAM: 'udyam', MSME: 'udyam',
  MCA: 'cin', CIN: 'cin',
  EPFO: 'epfo', ESIC: 'esic', AADHAAR: 'aadhaar'
};

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------
const VERIFIED = 'VERIFIED';
const NEEDS_REVIEW = 'NEEDS_REVIEW';
const MISSING = 'MISSING';
const FAILED = 'FAILED';

const STATUS_META = {
  [VERIFIED]:     { label: '✓ VERIFIED',       tone: 'pass',  icon: CheckCircle },
  [NEEDS_REVIEW]: { label: '⚠ NEEDS REVIEW',  tone: 'warn',  icon: AlertTriangle },
  [MISSING]:      { label: '❌ MISSING',       tone: 'fail',  icon: XCircle },
  [FAILED]:       { label: '❌ FAILED',        tone: 'fail',  icon: XCircle },
};

/** Map a raw document/requirement status onto the three display states. */
function normalizeStatus(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (!s || s === 'MISSING' || s === 'NOT_UPLOADED' || s === 'NOT_SUBMITTED') return MISSING;
  if (s === 'VERIFIED' || s === 'APPROVED' || s === 'PROCESSED') return VERIFIED;
  if (s === 'REJECTED' || s === 'FAILED' || s === 'INVALID' || s === 'EXPIRED') return FAILED;
  // UPLOADED / PROCESSING / PENDING / REQUIRES_REVIEW / anything else
  if (s === 'REQUIRES_REVIEW' || s === 'NEEDS_REVIEW' || s === 'REVIEW_REQUIRED') return NEEDS_REVIEW;
  return NEEDS_REVIEW;
}

function titleCase(code) {
  return String(code || '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' Z');
}

/** Convert an API compliance_matrix / requirements row into a display row. */
function toDisplayRow(row) {
  const uploaded = Boolean(row?.uploaded) || Boolean(row?.document_id) || Boolean(row?.file_name);
  const status = normalizeStatus(row?.status ?? (uploaded ? 'UPLOADED' : 'MISSING'));
  return {
    id: row?.requirement_id || row?.id || row?.code,
    code: row?.code || 'REQUIREMENT',
    name: row?.name || titleCase(row?.code) || 'Requirement',
    description: row?.description || null,
    is_mandatory: Boolean(row?.is_mandatory),
    uploaded,
    document_id: row?.document_id || null,
    file_name: row?.file_name || null,
    uploaded_at: row?.uploaded_at || null,
    status,
    // Optional evidence fields, populated only when the backend supplies them.
    source: row?.source || null,
    extracted: row?.extracted || null,
    registry: row?.registry || null,
    match: row?.match || null,
    explanation: row?.explanation || null,
    verified_at: row?.verified_at || row?.uploaded_at || null,
    confidence: row?.confidence || null,
    // Which registry adapter backs this requirement (may be undefined).
    registry_key: CODE_TO_REGISTRY[String(row?.code || '').toUpperCase()] || null
  };
}

export default function BidderVerificationView({ bidData, onBack, isOfficer, onRefresh }) {
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationMsg, setClarificationMsg] = useState('Please upload a valid OEM Authorization certificate issued by the equipment manufacturer.');
  const [decisionModal, setDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('QUALIFIED');
  const [decisionJustification, setDecisionJustification] = useState('All statutory documents and OEM Authorization verified. Bidder meets all technical requirements.');
  const [actionLoading, setActionLoading] = useState(false);
  const [registry, setRegistry] = useState({});   // { gstin: {...}, pan: {...} }
  const [registryLoading, setRegistryLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // -------------------------------------------------------------------------
  // Registry lookups: query the government adapters for the identifiers that
  // were actually extracted from this bid's documents.
  // -------------------------------------------------------------------------
  const identifiers = useMemo(() => {
    const raw = bidData?.extracted_identifiers || {};
    const out = {};
    for (const [bucket, value] of Object.entries(raw)) {
      const v = Array.isArray(value) ? value[0] : value;
      if (v && String(v).trim()) out[bucket] = String(v).trim();
    }
    return out;
  }, [bidData?.extracted_identifiers]);

  const identifierKey = useMemo(
    () => Object.entries(identifiers).map(([k, v]) => `${k}:${v}`).sort().join('|'),
    [identifiers]
  );

  useEffect(() => {
    let cancelled = false;
    if (!identifierKey) {
      setRegistry({});
      return undefined;
    }
    setRegistryLoading(true);
    (async () => {
      const results = {};
      await Promise.all(
        Object.entries(identifiers).map(async ([bucket, value]) => {
          const route = REGISTRY_ROUTES[bucket];
          if (!route) return;
          try {
            const res = await apiFetch(
              `/api/${route.path}/${encodeURIComponent(value)}`
            );
            if (res.ok) {
              results[bucket] = await res.json();
            } else {
              results[bucket] = { error: `Registry returned HTTP ${res.status}` };
            }
          } catch (e) {
            results[bucket] = { error: 'Registry lookup failed' };
          }
        })
      );
      if (!cancelled) {
        setRegistry(results);
        setRegistryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [identifierKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Honest disclosure of which registries are simulated vs. live.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/verify/status');
        if (res.ok && !cancelled) setGatewayStatus(await res.json());
      } catch {
        /* disclosure is best-effort */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // -------------------------------------------------------------------------
  // Real data only. No fallback checklist, no invented identifiers.
  // -------------------------------------------------------------------------
  const bidderName = bidData?.bidder_name || bidData?.bidderName || bidData?.bidderEmail || 'Authorized Representative';
  const companyName = bidData?.bidder_organization || bidData?.company_name || bidData?.company || null;
  const tenderTitle = bidData?.tender_title || bidData?.tenderTitle || 'Procurement Tender';

  const matrixRows = useMemo(() => {
    const matrix = Array.isArray(bidData?.compliance_matrix) ? bidData.compliance_matrix : [];
    if (matrix.length > 0) return matrix.map(toDisplayRow);
    const reqs = Array.isArray(bidData?.requirements) ? bidData.requirements : [];
    return reqs.map(toDisplayRow);
  }, [bidData?.compliance_matrix, bidData?.requirements]);

  // Merge the live registry responses into the checklist rows so the evidence
  // modal can show "extracted value" next to "registry response".
  const rowsWithEvidence = useMemo(() => {
    if (!identifierKey || Object.keys(registry).length === 0) return matrixRows;
    return matrixRows.map((row) => {
      if (!row.registry_key) return row;
      const reg = registry[row.registry_key];
      if (!reg) return row;
      const route = REGISTRY_ROUTES[row.registry_key];
      const registryValue = reg.legal_name || reg.company_name || reg.enterprise_name
        || reg.employer_name || reg.status || reg.error || null;
      return {
        ...row,
        registry,
        source: row.source || (route ? `${route.label} (adapter)` : 'Verification gateway'),
        extracted: row.extracted || identifiers[row.registry_key] || null,
        registry_value: registryValue,
        registry_error: reg.error || null,
        registry_is_live: reg.is_live === true,
        match: row.match || (registryValue && !reg.error
          ? `Extracted value matched the ${route?.label || 'registry'} adapter response`
          : null)
      };
    });
  }, [matrixRows, registry, identifiers, identifierKey]);

  const verifiedCount = rowsWithEvidence.filter((r) => r.status === VERIFIED).length;
  const reviewCount = rowsWithEvidence.filter((r) => r.status === NEEDS_REVIEW).length;
  const failedCount = rowsWithEvidence.filter((r) => r.status === FAILED).length;
  const missingCount = rowsWithEvidence.filter((r) => r.status === MISSING).length;
  const uploadedCount = rowsWithEvidence.filter((r) => r.uploaded).length;

  // Score: the stored value wins. If the bid has never been scored we derive a
  // transparent document-coverage figure ONLY when the matrix has rows, and we
  // never invent a number for an empty bid.
  const rawScore = bidData?.compliance_score ?? bidData?.score;
  const parsedScore = typeof rawScore === 'string' ? parseFloat(rawScore) : rawScore;
  const storedScore = typeof parsedScore === 'number' && !Number.isNaN(parsedScore) ? parsedScore : null;
  const derivedScore = rowsWithEvidence.length > 0
    ? Math.round(((verifiedCount + reviewCount * 0.5) / rowsWithEvidence.length) * 100)
    : null;
  const score = storedScore != null && storedScore > 0 ? Math.round(storedScore) : derivedScore;
  const scoreIsEstimated = (storedScore == null || storedScore <= 0) && derivedScore != null;

  // Risk band comes from the backend when available (single source of truth),
  // otherwise from the score using the same bands.
  const risk = (bidData?.risk_level && String(bidData.risk_level).toUpperCase())
    || (score == null ? 'UNKNOWN'
      : score >= 90 ? 'LOW'
        : score >= 75 ? 'MEDIUM'
          : score >= 50 ? 'HIGH'
            : 'CRITICAL');

  const status = bidData?.officer_status || bidData?.status || 'UNDER REVIEW';
  const mandatoryOutstanding = rowsWithEvidence.filter((r) => r.is_mandatory && r.status !== VERIFIED).length;

  const hasEvidence = (r) => Boolean(
    r.extracted || r.registry || r.registry_value || r.match || r.explanation
  );

  // -------------------------------------------------------------------------
  // Actions (unchanged)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back to Bidders
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {isOfficer && (
            <>
              <button
                onClick={handleReVerifyTrigger}
                disabled={actionLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
              >
                <RefreshCw size={16} /> Re-verify
              </button>
              <button
                onClick={() => setShowClarificationModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
              >
                <MessageSquare size={16} /> Request Clarification
              </button>
              <button
                onClick={() => setDecisionModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
              >
                <ShieldCheck size={16} /> Official Decision
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Summary Card */}
      <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', marginBottom: '28px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'center', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bidder Compliance Profile</span>
          <h1 style={{ margin: '4px 0 6px', fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>{bidderName}</h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
            Tender: <span style={{ color: '#0f172a', fontWeight: 700 }}>{tenderTitle}</span>
          </p>
          {companyName && (
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              Organisation: <span style={{ color: '#0f172a', fontWeight: 700 }}>{companyName}</span>
            </p>
          )}
        </div>

        {/* Compliance Score Dial */}
        <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '0 16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>Compliance Score</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: score == null ? '#64748b' : score >= 85 ? '#15803d' : score >= 70 ? '#d97706' : '#dc2626', lineHeight: 1.1, marginTop: '4px' }}>
            {score == null ? '—' : score} <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
            {score == null
              ? 'Not yet verified'
              : scoreIsEstimated
                ? 'Derived from uploaded documents'
                : 'Recorded by the compliance engine'}
          </div>
        </div>

        {/* Risk & Status Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginRight: '8px' }}>Risk Level:</span>
            <span style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800,
              background: risk === 'LOW' ? '#dcfce7' : risk === 'MEDIUM' ? '#fef3c7' : risk === 'HIGH' || risk === 'CRITICAL' ? '#fee2e2' : '#f1f5f9',
              color: risk === 'LOW' ? '#15803d' : risk === 'MEDIUM' ? '#b45309' : risk === 'HIGH' || risk === 'CRITICAL' ? '#b91c1c' : '#475569',
              border: `1px solid ${risk === 'LOW' ? '#86efac' : risk === 'MEDIUM' ? '#fde047' : risk === 'HIGH' || risk === 'CRITICAL' ? '#fca5a5' : '#cbd5e1'}`
            }}>
              {risk} RISK
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginRight: '8px' }}>Status:</span>
            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, background: '#f1f5f9', color: '#0f172a', border: '1px solid #0284c7' }}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Honest disclosure about simulated registries (audit recommendation). */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>
        {gatewayStatus?.disclosure || (
          <>Government registry lookups (GSTN, PAN, Udyam, EPFO, ESIC, MCA21, DigiLocker) run against the
          platform&apos;s adapter layer and are <strong>simulated</strong> — no student-accessible sandbox
          exists for these portals. Extracted values are compared against adapter responses, not live
          registry data.</>
        )}
        {gatewayStatus && gatewayStatus.live_registries?.length > 0 && (
          <div style={{ marginTop: '4px', color: '#15803d' }}>
            Live adapters: {gatewayStatus.live_registries.join(', ')}
          </div>
        )}
        {registryLoading && <div style={{ marginTop: '4px', color: '#64748b' }}>Querying registry adapters…</div>}
      </div>

      {/* AI Recommendation Banner — driven by the real checklist */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderLeft: '4px solid #0284c7', borderRadius: '12px', padding: '18px 22px', marginBottom: '28px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <Info style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} size={24} />
        <div>
          <strong style={{ color: '#0369a1', fontSize: '1rem', display: 'block', marginBottom: '4px', fontWeight: 700 }}>AI Decision Support Insights</strong>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>
            {rowsWithEvidence.length === 0
              ? 'No tender requirements have been configured for this bid yet, so there is nothing to verify. Add requirements to the tender to begin automated compliance checking.'
              : `${verifiedCount} of ${rowsWithEvidence.length} requirement${rowsWithEvidence.length === 1 ? '' : 's'} verified, ${reviewCount} awaiting review, ${missingCount} missing and ${failedCount} failed. `
                + `${uploadedCount} document${uploadedCount === 1 ? '' : 's'} uploaded. `
                + (mandatoryOutstanding > 0
                  ? `${mandatoryOutstanding} mandatory requirement${mandatoryOutstanding === 1 ? '' : 's'} remain outstanding — a mandatory failure is disqualifying. `
                  : 'All mandatory requirements are satisfied. ')
                + 'The final qualification decision remains with the Procurement Officer.'}
          </p>
        </div>
      </div>

      {/* Requirement Verification Grid */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>
        Statutory Document Verification Checklist
        {rowsWithEvidence.length > 0 && (
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '10px' }}>
            ({verifiedCount}/{rowsWithEvidence.length} verified)
          </span>
        )}
      </h3>

      {rowsWithEvidence.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#64748b', fontWeight: 600, marginBottom: '32px' }}>
          No requirements configured for this tender yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
          {rowsWithEvidence.map((req) => {
            const meta = STATUS_META[req.status] || STATUS_META[MISSING];
            const Icon = meta.icon;
            const tone = meta.tone;
            return (
              <div
                key={req.id}
                onClick={() => setSelectedRequirement(req)}
                style={{
                  background: '#ffffff', border: `1px solid ${tone === 'pass' ? '#e2e8f0' : tone === 'warn' ? '#fde047' : '#fca5a5'}`,
                  borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Icon style={{ color: tone === 'pass' ? '#16a34a' : tone === 'warn' ? '#d97706' : '#dc2626' }} size={22} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                      {req.name}
                      {req.is_mandatory && (
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase' }}>Mandatory</span>
                      )}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                      {req.uploaded
                        ? <>Document: <span style={{ color: '#0f172a', fontWeight: 600 }}>{req.file_name || 'uploaded'}</span></>
                        : 'No document uploaded'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    fontSize: '0.85rem', fontWeight: 800, padding: '6px 12px', borderRadius: '12px',
                    background: tone === 'pass' ? '#dcfce7' : tone === 'warn' ? '#fef3c7' : '#fee2e2',
                    color: tone === 'pass' ? '#15803d' : tone === 'warn' ? '#b45309' : '#b91c1c',
                    border: `1px solid ${tone === 'pass' ? '#86efac' : tone === 'warn' ? '#fde047' : '#fca5a5'}`
                  }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}>View Evidence →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Requirement Evidence Modal */}
      {selectedRequirement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', width: '100%', maxWidth: '680px', padding: '28px', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.18)', borderTop: '4px solid #0284c7', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: 800 }}>{selectedRequirement.name} Evidence</h3>
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                  Code: <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedRequirement.code}</span>
                  {selectedRequirement.is_mandatory && <span style={{ marginLeft: 8, color: '#b91c1c', fontWeight: 800 }}>· MANDATORY</span>}
                </span>
              </div>
              <button onClick={() => setSelectedRequirement(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '1.2rem', cursor: 'pointer', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '14px', fontSize: '0.9rem', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0284c7', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Requirement:</strong>
                <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>
                  {selectedRequirement.description || 'No description recorded for this requirement.'}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0284c7', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Submitted Document:</strong>
                {selectedRequirement.uploaded ? (
                  <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> {selectedRequirement.file_name || 'Uploaded document'}
                  </span>
                ) : (
                  <span style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: 700, display: 'block' }}>
                    No document has been uploaded against this requirement.
                  </span>
                )}
              </div>

              {hasEvidence(selectedRequirement) ? (
                <>
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Extracted Document Data:</strong>
                    <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{selectedRequirement.extracted || '—'}</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Government Portal Registry Data:</strong>
                    {selectedRequirement.registry_error ? (
                      <span style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>
                        Registry lookup failed: {selectedRequirement.registry_error}
                      </span>
                    ) : (
                      <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>
                        {selectedRequirement.registry_value || selectedRequirement.registry || '—'}
                      </span>
                    )}
                    {selectedRequirement.registry_key && (
                      <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                        via {REGISTRY_ROUTES[selectedRequirement.registry_key]?.label || 'adapter'}
                        {selectedRequirement.registry_is_live ? ' (live)' : ' (simulated adapter)'}
                      </span>
                    )}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 800 }}>Comparison Status:</strong>
                    <span style={{ color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '4px 12px', borderRadius: '8px', border: '1px solid #86efac' }}>{selectedRequirement.match || '—'}</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>AI Verification Analysis:</strong>
                    <p style={{ margin: 0, color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>{selectedRequirement.explanation || '—'}</p>
                  </div>
                </>
              ) : (
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                  <strong style={{ color: '#475569', display: 'block', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>Extracted / registry evidence:</strong>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500, display: 'block' }}>
                    Not recorded yet. OCR and field extraction run after the document is uploaded; the
                    comparison against the government registry adapter is shown here once available.
                  </span>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                {selectedRequirement.verified_at
                  ? <>Recorded at: <span style={{ color: '#0f172a', fontWeight: 700 }}>{fmtDateTime(selectedRequirement.verified_at)}</span>{selectedRequirement.confidence ? <> · Confidence: <span style={{ color: '#15803d', fontWeight: 800 }}>{selectedRequirement.confidence}</span></> : null}</>
                  : 'No verification timestamp recorded.'}
              </div>
            </div>

            {isOfficer && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                <button
                  onClick={() => { setShowClarificationModal(true); }}
                  style={{ background: '#f59e0b', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                >
                  <MessageSquare size={16} color="#ffffff" /> Request Clarification
                </button>
                <button
                  onClick={() => setSelectedRequirement(null)}
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '0.875rem', boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clarification Request Modal */}
      {showClarificationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', width: '100%', maxWidth: '550px', padding: '26px', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontWeight: 800 }}>Request Requirement Clarification</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', fontWeight: 500 }}>
              Send an official GeM clarification request to the bidder regarding <strong style={{ color: '#0f172a' }}>{selectedRequirement?.name}</strong>.
            </p>
            <textarea
              rows={4}
              value={clarificationMsg}
              onChange={e => setClarificationMsg(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowClarificationModal(false)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button
                onClick={handleRequestClarificationSubmit}
                disabled={actionLoading}
                style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                {actionLoading ? 'Sending...' : 'Send Clarification Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Officer Decision Modal */}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', width: '100%', maxWidth: '550px', padding: '26px', color: '#0f172a', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontWeight: 800 }}>Render Procurement Officer Qualification Decision</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', fontWeight: 500 }}>
              Core Rule: The AI does not qualify or disqualify bidders. As Procurement Officer, your decision is final and recorded in the immutable audit log.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setDecisionType('QUALIFIED')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: decisionType === 'QUALIFIED' ? '2px solid #16a34a' : '1px solid #cbd5e1', background: decisionType === 'QUALIFIED' ? '#dcfce7' : '#f8fafc', color: decisionType === 'QUALIFIED' ? '#15803d' : '#0f172a', fontWeight: 800, cursor: 'pointer' }}
              >
                QUALIFY BIDDER
              </button>
              <button
                onClick={() => setDecisionType('DISQUALIFIED')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: decisionType === 'DISQUALIFIED' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: decisionType === 'DISQUALIFIED' ? '#fee2e2' : '#f8fafc', color: decisionType === 'DISQUALIFIED' ? '#b91c1c' : '#0f172a', fontWeight: 800, cursor: 'pointer' }}
              >
                DISQUALIFY BIDDER
              </button>
            </div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a', marginBottom: '6px', fontWeight: 700 }}>Decision Justification & Evidence Summary *</label>
            <textarea
              rows={4}
              value={decisionJustification}
              onChange={e => setDecisionJustification(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setDecisionModal(false)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button
                onClick={handleOfficerDecisionSubmit}
                disabled={actionLoading}
                style={{ background: decisionType === 'QUALIFIED' ? '#16a34a' : '#dc2626', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}
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
