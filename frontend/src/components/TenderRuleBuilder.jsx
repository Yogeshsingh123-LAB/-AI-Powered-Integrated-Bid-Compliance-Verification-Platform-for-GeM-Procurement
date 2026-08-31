import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sliders, ShieldCheck, Save, RefreshCw } from 'lucide-react';
import './TenderRuleBuilder.css';

const DEFAULT_FIELDS = [
  { label: 'Minimum Annual Turnover (Lakhs)', value: 'turnover' },
  { label: 'Past Execution Experience (Years)', value: 'experience_years' },
  { label: 'Make in India Local Content (%)', value: 'local_content_pct' },
  { label: 'OEM Authorization Certificate', value: 'oem_authorization' }
];

const OPERATORS = ['>=', '<=', '==', 'contains'];

export default function TenderRuleBuilder({ tenderId = 'GEM/2026/001', token, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [customRules, setCustomRules] = useState([
    {
      rule_id: 'CR-01',
      name: 'Minimum Financial Turnover (50 Lakhs)',
      field: 'turnover',
      operator: '>=',
      value: 50,
      weight: 25,
      is_mandatory: true
    },
    {
      rule_id: 'CR-02',
      name: 'Make in India Local Content (50%)',
      field: 'local_content_pct',
      operator: '>=',
      value: 50,
      weight: 20,
      is_mandatory: false
    }
  ]);

  const [scoringWeights, setScoringWeights] = useState({
    completeness: 25,
    verification: 35,
    integrity: 20,
    custom_rules: 20
  });

  const addRule = () => {
    const newId = `CR-0${customRules.length + 1}`;
    setCustomRules([
      ...customRules,
      {
        rule_id: newId,
        name: `Custom Requirement Rule ${customRules.length + 1}`,
        field: 'turnover',
        operator: '>=',
        value: 20,
        weight: 15,
        is_mandatory: true
      }
    ]);
  };

  const removeRule = (index) => {
    setCustomRules(customRules.filter((_, i) => i !== index));
  };

  const updateRule = (index, key, val) => {
    const updated = [...customRules];
    updated[index][key] = val;
    setCustomRules(updated);
  };

  const updateWeight = (key, val) => {
    setScoringWeights({ ...scoringWeights, [key]: Number(val) });
  };

  const saveConfiguration = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tenders/${tenderId}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          custom_rules: customRules,
          scoring_weights: scoringWeights
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Tender custom rules and weighted scoring saved successfully!');
        if (onSaveSuccess) onSaveSuccess(data);
      } else {
        setMessage(`Save Failed: ${data.detail || 'Error saving config.'}`);
      }
    } catch (err) {
      setMessage(`Save Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tender-rule-builder-card">
      <div className="builder-header">
        <div className="builder-title">
          <Sliders className="icon-blue" size={24} />
          <div>
            <h3>Tender Rule Builder & Dynamic Weighted Scoring Engine</h3>
            <p>Define custom buyer compliance conditions and assign per-tender scoring weights for tender <strong>{tenderId}</strong>.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={saveConfiguration} disabled={saving}>
          {saving ? <RefreshCw className="spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {message && <div className={`builder-alert ${message.includes('Failed') || message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      <div className="weights-section">
        <h4><ShieldCheck size={18} /> Buyer-Configured Score Category Weights (Total: 100%)</h4>
        <div className="weights-grid">
          <div className="weight-box">
            <label>Completeness Weight (%): {scoringWeights.completeness}</label>
            <input type="range" min="0" max="50" value={scoringWeights.completeness} onChange={(e) => updateWeight('completeness', e.target.value)} />
          </div>
          <div className="weight-box">
            <label>DB Verification Weight (%): {scoringWeights.verification}</label>
            <input type="range" min="0" max="50" value={scoringWeights.verification} onChange={(e) => updateWeight('verification', e.target.value)} />
          </div>
          <div className="weight-box">
            <label>Registry Integrity Weight (%): {scoringWeights.integrity}</label>
            <input type="range" min="0" max="50" value={scoringWeights.integrity} onChange={(e) => updateWeight('integrity', e.target.value)} />
          </div>
          <div className="weight-box">
            <label>Buyer Custom Rules Weight (%): {scoringWeights.custom_rules}</label>
            <input type="range" min="0" max="50" value={scoringWeights.custom_rules} onChange={(e) => updateWeight('custom_rules', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="rules-section">
        <div className="rules-header">
          <h4>Custom Procurement Compliance Rules</h4>
          <button className="btn-secondary" onClick={addRule}>
            <Plus size={16} /> Add Condition Rule
          </button>
        </div>

        <div className="rules-list">
          {customRules.map((rule, idx) => (
            <div className="rule-item-card" key={rule.rule_id || idx}>
              <div className="rule-row-header">
                <input
                  type="text"
                  className="rule-name-input"
                  value={rule.name}
                  onChange={(e) => updateRule(idx, 'name', e.target.value)}
                  placeholder="Rule Name (e.g. Min Turnover)"
                />
                <button className="btn-icon-danger" onClick={() => removeRule(idx)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="rule-inputs-grid">
                <div className="input-group">
                  <label>Field</label>
                  <select value={rule.field} onChange={(e) => updateRule(idx, 'field', e.target.value)}>
                    {DEFAULT_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Operator</label>
                  <select value={rule.operator} onChange={(e) => updateRule(idx, 'operator', e.target.value)}>
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Target Value</label>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateRule(idx, 'value', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Rule Points Weight</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={rule.weight}
                    onChange={(e) => updateRule(idx, 'weight', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
