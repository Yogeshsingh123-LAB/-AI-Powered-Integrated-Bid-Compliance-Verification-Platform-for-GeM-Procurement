import React, { useState } from 'react';
import { 
  Building2, FileText, CheckCircle2, ShieldAlert, Award, FileSpreadsheet, 
  ChevronRight, ChevronLeft, Plus, Trash2, Info, AlertTriangle, Layers, Calendar, DollarSign
} from 'lucide-react';
import { apiFetch } from '../services/api';

const DEFAULT_REQUIREMENTS = [
  { id: '1', name: 'GST Registration', category: 'Taxation', mandatory: true, condition: 'All Commercial Bidders', document: 'GST Certificate', method: 'Document & GST Portal Verification', source: 'GSTN Portal API', weight: 15, passCriteria: 'GST status = ACTIVE', failCriteria: 'GST inactive or GSTIN mismatch', riskSeverity: 'HIGH' },
  { id: '2', name: 'PAN Card Verification', category: 'Identity', mandatory: true, condition: 'All Bidders', document: 'PAN Certificate', method: 'PAN Portal API & Name Similarity', source: 'Income Tax Dept', weight: 10, passCriteria: 'PAN Status = ACTIVE and Legal Name Match', failCriteria: 'Invalid PAN or entity mismatch', riskSeverity: 'HIGH' },
  { id: '3', name: 'Udyam / MSME Certificate', category: 'MSME', mandatory: false, condition: 'MSME Exemption Seekers', document: 'Udyam Certificate', method: 'Udyam Portal Verification', source: 'Ministry of MSME', weight: 10, passCriteria: 'Udyam Active and Enterprise Category Verified', failCriteria: 'Expired or Invalid Udyam Number', riskSeverity: 'MEDIUM' },
  { id: '4', name: 'Income Tax Returns (ITR)', category: 'Financial', mandatory: true, condition: 'Bidders with turnover > 20 Lakhs', document: 'ITR-V for last 3 FYs', method: 'Financial Data Extraction', source: 'Income Tax E-filing', weight: 15, passCriteria: 'Returns filed for 3 consecutive years', failCriteria: 'Missing return filing for any year', riskSeverity: 'HIGH' },
  { id: '5', name: 'EPFO Compliance', category: 'Labor', mandatory: true, condition: 'Establishments > 20 Employees', document: 'EPF Registration & ECR Receipt', method: 'EPFO Portal Match', source: 'EPFO India', weight: 10, passCriteria: 'EPFO Status = COMPLIANT', failCriteria: 'EPFO remittance default or name mismatch', riskSeverity: 'MEDIUM' },
  { id: '6', name: 'ESIC Compliance', category: 'Labor', mandatory: true, condition: 'Establishments > 10 Employees', document: 'ESIC Registration Certificate', method: 'ESIC Portal Match', source: 'ESIC India', weight: 10, passCriteria: 'Active Employer Code & Filing', failCriteria: 'ESIC default', riskSeverity: 'MEDIUM' },
  { id: '7', name: 'Make in India (Local Content)', category: 'Statutory', mandatory: true, condition: 'All Bidders', document: 'Local Content Declaration', method: 'AI Extraction & % Calculation', source: 'Bidder Declaration', weight: 10, passCriteria: 'Local Content >= 50% (Class-I)', failCriteria: '< 20% Local Content', riskSeverity: 'HIGH' },
  { id: '8', name: 'OEM Authorization (MAF)', category: 'Technical', mandatory: true, condition: 'Resellers & System Integrators', document: 'OEM Authorization Letter', method: 'OCR & OEM Domain Validation', source: 'Original Equipment Manufacturer', weight: 10, passCriteria: 'Valid tender-specific authorization', failCriteria: 'Missing OEM Letter or expired MAF', riskSeverity: 'CRITICAL' },
  { id: '9', name: 'Non-Blacklisting Declaration', category: 'Compliance', mandatory: true, condition: 'All Bidders', document: 'Affidavit / Non-Blacklist Certificate', method: 'Central Debarment Registry Lookup', source: 'GeM & Central Portal', weight: 10, passCriteria: 'No Debarment records found', failCriteria: 'Active Debarment order in database', riskSeverity: 'CRITICAL' }
];

export default function CreateTenderWizard({ onTenderCreated, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Basic Information
  const [basicInfo, setBasicInfo] = useState({
    tenderId: `GEM/${new Date().getFullYear()}/B/${Math.floor(100000 + Math.random() * 900000)}`,
    refNumber: `GEM-REF-${Math.floor(10000 + Math.random() * 90000)}`,
    title: 'Supply, Installation & Maintenance of High-Performance Server Infrastructure',
    department: 'Ministry of Electronics & Information Technology (MeitY)',
    category: 'IT Hardware & Cloud Infrastructure',
    description: 'Procurement of enterprise rack servers, storage arrays, and network switches for state data center expansion with 3-year comprehensive warranty.',
    estimatedValue: '4500000',
    publicationDate: new Date().toISOString().split('T')[0],
    submissionStartDate: new Date().toISOString().split('T')[0],
    submissionDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  // Step 2: Eligibility Requirements
  const [requirements, setRequirements] = useState(DEFAULT_REQUIREMENTS);

  // Step 3: Required Documents
  const [documents, setDocuments] = useState([
    { name: 'PAN Card Certificate', required: true, formats: '.pdf,.png,.jpg', maxSizeMB: 5, expiryCheck: true },
    { name: 'GSTIN Registration Certificate', required: true, formats: '.pdf', maxSizeMB: 5, expiryCheck: false },
    { name: 'Udyam / MSME Certificate', required: false, formats: '.pdf', maxSizeMB: 5, expiryCheck: false },
    { name: 'Income Tax Returns (Last 3 Years)', required: true, formats: '.pdf', maxSizeMB: 10, expiryCheck: true },
    { name: 'EPFO & ESIC Compliance Receipts', required: true, formats: '.pdf', maxSizeMB: 5, expiryCheck: true },
    { name: 'Make in India Local Content Declaration', required: true, formats: '.pdf', maxSizeMB: 5, expiryCheck: false },
    { name: 'OEM Authorization Form (MAF)', required: true, formats: '.pdf', maxSizeMB: 5, expiryCheck: true },
    { name: 'Non-Blacklisting Affidavit', required: true, formats: '.pdf', maxSizeMB: 5, expiryCheck: true }
  ]);

  // Step 4: Verification Rules Toggles
  const [rules, setRules] = useState({
    apiPortalCheck: true,
    ocrExtraction: true,
    aiFieldValidation: true,
    crossDocMatching: true,
    expiryValidation: true,
    fuzzyNameMatching: true,
    registrationNumberMatching: true,
    dateValidation: true,
    blacklistRegistryCheck: true
  });

  // Step 5: Scoring Weights & Risk Thresholds
  const [scoring, setScoring] = useState({
    panWeight: 10,
    gstWeight: 15,
    udyamWeight: 10,
    incomeTaxWeight: 15,
    epfoWeight: 10,
    esicWeight: 10,
    miiWeight: 10,
    oemWeight: 10,
    blacklistWeight: 10,
    lowRiskThreshold: 90,
    mediumRiskThreshold: 75,
    highRiskThreshold: 50,
    criticalRiskThreshold: 0
  });

  const totalScoreWeight = Object.keys(scoring)
    .filter(k => k.endsWith('Weight'))
    .reduce((sum, key) => sum + (parseInt(scoring[key], 10) || 0), 0);

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!basicInfo.title || !basicInfo.estimatedValue || !basicInfo.submissionDeadline) {
        setErrorMsg('Please complete all required fields in Basic Information.');
        return;
      }
    }
    if (currentStep === 5 && totalScoreWeight !== 100) {
      setErrorMsg(`Total scoring weights must equal exactly 100. Current sum: ${totalScoreWeight}`);
      return;
    }
    setCurrentStep(prev => Math.min(6, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handlePublishTender = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        tender_id: basicInfo.tenderId,
        ref_number: basicInfo.refNumber,
        title: basicInfo.title,
        department: basicInfo.department,
        category: basicInfo.category,
        description: basicInfo.description,
        budget_limit: parseFloat(basicInfo.estimatedValue),
        publication_date: basicInfo.publicationDate,
        closing_date: basicInfo.submissionDeadline,
        status: 'ACTIVE',
        requirements: requirements,
        required_documents: documents,
        verification_rules: rules,
        scoring_weights: scoring
      };

      const res = await apiFetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create tender.');
      }

      const created = await res.json();
      if (onTenderCreated) onTenderCreated(created);
    } catch (err) {
      setErrorMsg(err.message || 'Error publishing tender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', borderRadius: '16px', border: '1px solid #1e293b', padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Step Header Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet style={{ color: '#38bdf8' }} /> Create New GeM Procurement Tender
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
            Configure multi-layer verification requirements, statutory compliance rules, and scoring thresholds.
          </p>
        </div>
        <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
          Step {currentStep} of 6
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {['1. Basic Info', '2. Eligibility', '3. Documents', '4. Verification Rules', '5. Scoring', '6. Review & Publish'].map((stepLabel, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <div 
              key={idx} 
              onClick={() => stepNum <= currentStep && setCurrentStep(stepNum)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: stepNum <= currentStep ? 'pointer' : 'default',
                background: isActive ? 'linear-gradient(135deg, #0284c7, #2563eb)' : isDone ? '#1e293b' : '#0f172a',
                color: isActive ? '#ffffff' : isDone ? '#38bdf8' : '#64748b',
                border: isActive ? '1px solid #38bdf8' : isDone ? '1px solid #334155' : '1px solid #1e293b',
                transition: 'all 0.2s ease'
              }}
            >
              {stepLabel}
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* STEP 1: Basic Information */}
      {currentStep === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Tender ID *</label>
            <input 
              type="text" 
              value={basicInfo.tenderId} 
              onChange={e => setBasicInfo({...basicInfo, tenderId: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Tender Reference Number</label>
            <input 
              type="text" 
              value={basicInfo.refNumber} 
              onChange={e => setBasicInfo({...basicInfo, refNumber: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Tender Title *</label>
            <input 
              type="text" 
              value={basicInfo.title} 
              onChange={e => setBasicInfo({...basicInfo, title: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Organization / Department</label>
            <input 
              type="text" 
              value={basicInfo.department} 
              onChange={e => setBasicInfo({...basicInfo, department: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Tender Category</label>
            <select 
              value={basicInfo.category} 
              onChange={e => setBasicInfo({...basicInfo, category: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            >
              <option value="IT Hardware & Cloud Infrastructure">IT Hardware & Cloud Infrastructure</option>
              <option value="Industrial Safety Equipment">Industrial Safety Equipment</option>
              <option value="Medical & Healthcare Supplies">Medical & Healthcare Supplies</option>
              <option value="Custom Works & Civil Services">Custom Works & Civil Services</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Tender Description</label>
            <textarea 
              rows={3} 
              value={basicInfo.description} 
              onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Estimated Tender Value (INR ₹) *</label>
            <input 
              type="number" 
              value={basicInfo.estimatedValue} 
              onChange={e => setBasicInfo({...basicInfo, estimatedValue: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>Submission Deadline *</label>
            <input 
              type="date" 
              value={basicInfo.submissionDeadline} 
              onChange={e => setBasicInfo({...basicInfo, submissionDeadline: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
            />
          </div>
        </div>
      )}

      {/* STEP 2: Eligibility Requirements */}
      {currentStep === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>Statutory & Technical Requirements</h3>
            <button 
              onClick={() => setRequirements([...requirements, { id: `${Date.now()}`, name: 'New Custom Requirement', category: 'General', mandatory: true, condition: 'All Bidders', document: 'Document Proof', method: 'Document Verification', source: 'Manual/API', weight: 10, passCriteria: 'Document Valid', failCriteria: 'Document Missing', riskSeverity: 'MEDIUM' }])}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add Requirement
            </button>
          </div>

          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'grid', gap: '12px' }}>
            {requirements.map((req, index) => (
              <div key={req.id} style={{ background: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    value={req.name} 
                    onChange={e => {
                      const updated = [...requirements];
                      updated[index].name = e.target.value;
                      setRequirements(updated);
                    }}
                    style={{ padding: '6px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontWeight: 600 }}
                  />
                  <select 
                    value={req.category}
                    onChange={e => {
                      const updated = [...requirements];
                      updated[index].category = e.target.value;
                      setRequirements(updated);
                    }}
                    style={{ padding: '6px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1' }}
                  >
                    <option value="Taxation">Taxation</option>
                    <option value="Identity">Identity</option>
                    <option value="MSME">MSME</option>
                    <option value="Financial">Financial</option>
                    <option value="Labor">Labor</option>
                    <option value="Statutory">Statutory</option>
                    <option value="Technical">Technical</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#38bdf8', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={req.mandatory} 
                      onChange={e => {
                        const updated = [...requirements];
                        updated[index].mandatory = e.target.checked;
                        setRequirements(updated);
                      }}
                    /> Mandatory
                  </label>
                  <button 
                    onClick={() => setRequirements(requirements.filter(r => r.id !== req.id))}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Verification:</strong> {req.method}</div>
                  <div><strong style={{ color: '#94a3b8' }}>Source:</strong> {req.source}</div>
                  <div><strong style={{ color: '#94a3b8' }}>Pass Criteria:</strong> {req.passCriteria}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Required Documents */}
      {currentStep === 3 && (
        <div>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#f8fafc' }}>Document Submission Rules</h3>
          <div style={{ display: 'grid', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {documents.map((doc, idx) => (
              <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px 18px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#f8fafc', display: 'block' }}>{doc.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formats: {doc.formats} | Max: {doc.maxSizeMB}MB</span>
                </div>
                <div>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: doc.required ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: doc.required ? '#fca5a5' : '#93c5fd' }}>
                    {doc.required ? 'REQUIRED' : 'OPTIONAL'}
                  </span>
                </div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="checkbox" 
                    checked={doc.expiryCheck} 
                    onChange={e => {
                      const updated = [...documents];
                      updated[idx].expiryCheck = e.target.checked;
                      setDocuments(updated);
                    }}
                  /> Verify Expiry
                </label>
                <button 
                  onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'right' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Verification Rules */}
      {currentStep === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { key: 'apiPortalCheck', title: 'Government API / Gateway Check', desc: 'Queries live GSTN, PAN, Udyam, EPFO, ESIC & MCA mock gateways.' },
            { key: 'ocrExtraction', title: 'AI OCR & Vision Extraction', desc: 'Runs Tesseract OCR & LayoutLM on scanned bid documents.' },
            { key: 'aiFieldValidation', title: 'AI Structured Data Field Validation', desc: 'Validates statutory regex syntax for GSTIN, PAN & Udyam IDs.' },
            { key: 'crossDocMatching', title: 'Cross-Document Matching Engine', desc: 'Checks entity name and identifier consistency across uploaded files.' },
            { key: 'expiryValidation', title: 'Certificate Expiry Verification', desc: 'Flags expired registration certificates and MAFs.' },
            { key: 'fuzzyNameMatching', title: 'Fuzzy Name Similarity Matching', desc: 'Evaluates Levenshtein distance for corporate name variations.' },
            { key: 'blacklistRegistryCheck', title: 'Central Debarment / Blacklist Lookup', desc: 'Scans Ministry & GeM debarment registry databases.' }
          ].map((rule) => (
            <div key={rule.key} style={{ background: '#1e293b', border: '1px solid #334155', padding: '16px', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <input 
                type="checkbox" 
                checked={rules[rule.key]} 
                onChange={e => setRules({...rules, [rule.key]: e.target.checked})}
                style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc', marginBottom: '2px' }}>{rule.title}</strong>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{rule.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 5: Scoring */}
      {currentStep === 5 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>Configurable Weight Breakdown (Total: 100)</h3>
            <div style={{ background: totalScoreWeight === 100 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: `1px solid ${totalScoreWeight === 100 ? '#22c55e' : '#ef4444'}`, color: totalScoreWeight === 100 ? '#4ade80' : '#fca5a5', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
              Total Weight: {totalScoreWeight} / 100
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'PAN Card Verification Weight', key: 'panWeight' },
              { label: 'GST Registration Weight', key: 'gstWeight' },
              { label: 'Udyam / MSME Weight', key: 'udyamWeight' },
              { label: 'Income Tax Return Weight', key: 'incomeTaxWeight' },
              { label: 'EPFO Compliance Weight', key: 'epfoWeight' },
              { label: 'ESIC Compliance Weight', key: 'esicWeight' },
              { label: 'Make in India Content Weight', key: 'miiWeight' },
              { label: 'OEM Authorization Weight', key: 'oemWeight' },
              { label: 'Non-Blacklisting Weight', key: 'blacklistWeight' }
            ].map(item => (
              <div key={item.key} style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{item.label}</span>
                <input 
                  type="number" 
                  value={scoring[item.key]} 
                  onChange={e => setScoring({...scoring, [item.key]: parseInt(e.target.value, 10) || 0})}
                  style={{ width: '60px', padding: '6px', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', textAlign: 'center', fontWeight: 600 }}
                />
              </div>
            ))}
          </div>

          <h4 style={{ margin: '16px 0 10px', fontSize: '0.9rem', color: '#f8fafc' }}>Risk Classification Score Thresholds</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ color: '#4ade80', fontWeight: 700, display: 'block' }}>LOW RISK</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Score: {scoring.lowRiskThreshold} – 100</span>
            </div>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ color: '#fde047', fontWeight: 700, display: 'block' }}>MEDIUM RISK</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Score: {scoring.mediumRiskThreshold} – {scoring.lowRiskThreshold - 1}</span>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid #f97316', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ color: '#fdba74', fontWeight: 700, display: 'block' }}>HIGH RISK</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Score: {scoring.highRiskThreshold} – {scoring.mediumRiskThreshold - 1}</span>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ color: '#fca5a5', fontWeight: 700, display: 'block' }}>CRITICAL RISK</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Score: 0 – {scoring.highRiskThreshold - 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Publish */}
      {currentStep === 6 && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
            Tender Configuration Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem', marginBottom: '20px' }}>
            <div><strong style={{ color: '#94a3b8' }}>Tender ID:</strong> {basicInfo.tenderId}</div>
            <div><strong style={{ color: '#94a3b8' }}>Reference No:</strong> {basicInfo.refNumber}</div>
            <div><strong style={{ color: '#94a3b8' }}>Department:</strong> {basicInfo.department}</div>
            <div><strong style={{ color: '#94a3b8' }}>Estimated Value:</strong> ₹{parseFloat(basicInfo.estimatedValue).toLocaleString()}</div>
            <div><strong style={{ color: '#94a3b8' }}>Deadline:</strong> {basicInfo.submissionDeadline}</div>
            <div><strong style={{ color: '#94a3b8' }}>Total Requirements:</strong> {requirements.length} configured</div>
          </div>

          <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#38bdf8' }}>Configured Verification Checks:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#cbd5e1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <li>GST, PAN & Udyam Portal Verification</li>
              <li>EPFO & ESIC Compliance Cross-Checking</li>
              <li>OEM Authorization & MAF Validation</li>
              <li>Central Blacklist / Debarment Registry Check</li>
            </ul>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
        <button 
          onClick={currentStep === 1 ? onCancel : handleBack}
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          <ChevronLeft size={18} /> {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>

        {currentStep < 6 ? (
          <button 
            onClick={handleNext}
            style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            Next Step <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            onClick={handlePublishTender}
            disabled={isSubmitting}
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none', color: '#fff', padding: '10px 28px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          >
            <CheckCircle2 size={18} /> {isSubmitting ? 'Publishing Tender...' : 'Publish Tender'}
          </button>
        )}
      </div>

    </div>
  );
}
