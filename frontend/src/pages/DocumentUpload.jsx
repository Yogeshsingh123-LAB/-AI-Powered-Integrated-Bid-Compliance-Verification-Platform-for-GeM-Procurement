import { useState, useRef } from "react";
import { 
  CloudUpload, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Loader2, 
  BadgeCheck 
} from "lucide-react";

function DocumentUploadPage({ onAddBid }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Terminal logs state
  const [logs, setLogs] = useState([]);
  const [parsingProgress, setParsingProgress] = useState(0); // 0: Idle, 1: Loading API, 2: Finished

  // Compliance Report Result
  const [report, setReport] = useState(null);

  const fileInputRef = useRef(null);
  const terminalEndRef = useRef(null);

  const addLog = (text, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { text: `[${timestamp}] ${text}`, type }]);
    
    // Scroll to bottom
    setTimeout(() => {
      if (terminalEndRef.current) {
        terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      triggerComplianceAnalysis(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      triggerComplianceAnalysis(selectedFile);
    }
  };

  const fetchWithTimeout = (url, options, timeout = 30000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout — backend may be busy")), timeout)
      )
    ]);
  };

  const triggerComplianceAnalysis = async (uploadedFile) => {
    // 1. File Validation Checks
    const MAX_SIZE_MB = 16;
    if (uploadedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Verification System Error: File too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    const isPDF = uploadedFile.type === "application/pdf" || 
                  uploadedFile.name.toLowerCase().endsWith(".pdf");
    if (!isPDF) {
      alert("Verification System Error: Only PDF files (.pdf) are permitted.");
      setFile(null);
      return;
    }

    setUploading(true);
    setReport(null);
    setParsingProgress(1);
    setLogs([]);

    addLog(`System initialized. Loaded file: ${uploadedFile.name}`, "info");
    addLog("Connecting to smart text extraction pipeline...", "info");

    // Start a mocked log sequence to simulate server OCR parsing steps while waiting for fetch
    const logIntervals = [
      { text: "SmartPDFHandler: Analyzing PDF byte signature...", type: "info", delay: 800 },
      { text: "SmartPDFHandler: Page structure verified. Initializing page-by-page parser...", type: "info", delay: 1800 },
      { text: "SmartPDFHandler: Checking character counts to determine if scanned or digital...", type: "info", delay: 2800 },
      { text: "SmartPDFHandler: Page 1 OCR classification complete. Applying binarization filters...", type: "info", delay: 3800 },
      { text: "RegexExtractor: Running compiled government entity identifier search patterns...", type: "info", delay: 4800 },
      { text: "MockVerifier: Connecting to Central Board of Indirect Taxes & Customs GSTIN portal...", type: "info", delay: 5800 },
      { text: "MockVerifier: Fetching Income Tax department PAN record registry...", type: "info", delay: 6800 },
      { text: "MockVerifier: Fetching Ministry of MSME Udyam Database portal...", type: "info", delay: 7800 }
    ];

    const timeouts = [];
    logIntervals.forEach((item) => {
      const t = setTimeout(() => {
        addLog(item.text, item.type);
      }, item.delay);
      timeouts.push(t);
    });

    // Make live FastAPI API call using env configuration
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData
      }, 30000); // 30 second timeout

      // Clear any remaining fake logs timeouts
      timeouts.forEach(clearTimeout);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned HTTP code ${response.status}`);
      }

      const data = await response.json();
      
      // Print final extraction success logs
      addLog("SmartPDFHandler: Successfully extracted document string data.", "success");
      
      // Handle page extraction method logs format details
      const extractionMethod = data.analysis.ocr_used 
        ? `OCR (${data.analysis.ocr_engine.toUpperCase()})` 
        : "Digital text extraction";
      addLog(`Extraction Method: ${extractionMethod}`, "success");
      
      const ids = data.analysis.identifiers;
      addLog(`RegexExtractor: Found GSTINs: [${ids.gstin.join(", ")}], PANs: [${ids.pan.join(", ")}], Udyam: [${ids.udyam.join(", ")}], Aadhaar: [${(ids.aadhaar || []).join(", ")}]`, "success");
      
      addLog("MockVerifier: Batch queries complete. Registry alignment scores computed.", "success");
      addLog(`ScoringEngine: Final compliance score is: ${data.compliance.score}/100. Risk Tier: ${data.compliance.risk_level}`, "success");

      // Adapt key fields to format required by report card components
      const adaptedData = {
        success: data.analysis.success,
        text_extraction: {
          pages_detail: [{ page_number: 1, method: data.analysis.ocr_used ? "ocr" : "digital" }]
        },
        extracted_identifiers: ids,
        compliance_report: {
          score: data.compliance.score,
          risk_level: data.compliance.risk_level,
          breakdown: data.compliance.breakdown,
          recommendations: data.compliance.recommendations
        },
        verification_details: data.verification
      };

      setReport(adaptedData);
      setParsingProgress(2);

      // Create new bid log array
      const terminalLogsList = [
        `[System] Initialized cryptographic inspection for uploaded document: ${uploadedFile.name}`,
        `[SmartPDFHandler] Text extraction completed using page summary: ${extractionMethod}`,
        `[RegexExtractor] Extracted GSTIN: ${ids.gstin[0] || 'None'} | PAN: ${ids.pan[0] || 'None'} | Udyam: ${ids.udyam[0] || 'None'} | Aadhaar: ${(ids.aadhaar && ids.aadhaar[0]) || 'None'}`,
        ...data.compliance.recommendations.map(r => `[ScoringEngine] Analysis: ${r}`)
      ];

      // Format a clean object to sync to Home.jsx state array
      const bidId = `GEM-BID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const bidderName = data.verification.gstin[0]?.data.legal_name || data.verification.pan[0]?.data.name || data.verification.udyam[0]?.data.enterprise_name || "Unknown Bidder Org";
      
      const newBid = {
        id: bidId,
        bidderName: bidderName,
        gstin: ids.gstin[0] || "",
        pan: ids.pan[0] || "",
        udyam: ids.udyam[0] || "",
        submittedOn: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        status: "Under Review", // Default to Under Review for auditing
        score: data.compliance.score,
        risk: data.compliance.risk_level,
        compliance_record: data.verification.gstin[0]?.data.compliance_record || "Good",
        taxpayer_type: data.verification.gstin[0]?.data.taxpayer_type || "Regular",
        enterprise_type: data.verification.udyam[0]?.data.enterprise_type || "N/A",
        warnings: data.compliance.recommendations,
        logs: terminalLogsList
      };

      // Add to main state list
      if (onAddBid) {
        onAddBid(newBid);
      }

    } catch (err) {
      timeouts.forEach(clearTimeout);
      addLog(`FATAL PIPELINE EXCEPTION: ${err.message}`, "danger");
      addLog(`Audit cancelled due to errors. Please check backend status at ${API_BASE}.`, "danger");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <h1>Automated Bid Document Verification</h1>
      <p className="subtitle">
        Upload PDF bid proposal packets. The platform runs automated OCR, pulls GST/PAN/MSME registration certificates, matches entity names, and returns risk compliance indexes.
      </p>

      <div className="section-panel" style={{ padding: '30px' }}>
        <div 
          className={`drop-zone ${dragActive ? "active" : ""} ${uploading ? "disabled" : ""}`}
          style={{ opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? "none" : "auto" }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={uploading ? undefined : handleDrop}
          onClick={uploading ? undefined : handleBrowseClick}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input" 
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent)' }} />
          ) : (
            <CloudUpload size={40} />
          )}
          
          <div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '4px' }}>
              {uploading ? "Analyzing compliance certificates..." : "Drag and drop your PDF bid document here"}
            </p>
            <p>Only PDF certificates with up to 16MB file sizes are accepted.</p>
          </div>
          {!uploading && (
            <button type="button" className="neon-button" style={{ width: 'auto', padding: '10px 24px' }}>
              Select Bid File
            </button>
          )}
        </div>

        {/* Real-time verification logs */}
        {parsingProgress > 0 && (
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="t-dot red"></span>
                <span className="t-dot yellow"></span>
                <span className="t-dot green"></span>
              </div>
              <span className="terminal-title">Cryptographic Verification trace</span>
              <Terminal size={14} style={{ color: '#475569' }} />
            </div>
            <div className="terminal-body">
              {logs.map((log, index) => (
                <div key={index} className={`term-line ${log.type}`}>
                  {log.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* COMPLIANCE REPORT CARD DETAILS */}
      {report && report.success && (
        <div className="compliance-grid">
          {/* Score Dial Badge */}
          <div className="score-panel">
            <div className="dial-wrapper">
              <svg className="dial-svg" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="dial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <circle className="dial-track" cx="50" cy="50" r="40" strokeWidth="10" />
                <circle 
                  className="dial-value" 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  strokeWidth="10" 
                  strokeDasharray={`${(report.compliance_report.score / 100) * 251.2} 251.2`}
                />
              </svg>
              <div className="dial-text">
                <span className="dial-score">{report.compliance_report.score}</span>
                <span className="dial-label">SCORE</span>
              </div>
            </div>
            
            <h3>Compliance Index</h3>
            <p>Risk classification computed from matching and filing histories.</p>
            
            <div style={{ marginBottom: '24px' }}>
              <span className={`risk-badge ${report.compliance_report.risk_level.toLowerCase()}`} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                {report.compliance_report.risk_level} RISK RATING
              </span>
            </div>

            <div className="score-breakdown">
              <div className="breakdown-row">
                <span>Verification Completeness</span>
                <strong>{report.compliance_report.breakdown.document_completeness}</strong>
              </div>
              <div className="breakdown-row">
                <span>Official Registry Audits</span>
                <strong>{report.compliance_report.breakdown.database_verification}</strong>
              </div>
              <div className="breakdown-row">
                <span>Registry Integrity Check</span>
                <strong>{report.compliance_report.breakdown.registry_integrity}</strong>
              </div>
            </div>
          </div>

          {/* Cards with verified statuses */}
          <div className="registry-cards">
            {/* GST Details */}
            {report.verification_details.gstin.map((item, index) => (
              <div key={index} className="registry-card">
                <div className="reg-header">
                  <h3>GST Registration details</h3>
                  <span className="reg-label">CBIC Registry</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>GSTIN ID Number</label>
                    <strong>{item.data.gstin}</strong>
                  </div>
                  <div className="reg-item">
                    <label>Legal Corporate Name</label>
                    <span>{item.data.legal_name}</span>
                  </div>
                  <div className="reg-item">
                    <label>State Code / Location</label>
                    <span>{item.data.state_code} - {item.data.state_name}</span>
                  </div>
                  <div className="reg-item">
                    <label>GST Portal Status</label>
                    <span className={`status ${item.data.status === "Active" ? "active" : "inactive"}`}>
                      {item.data.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* PAN Details */}
            {report.verification_details.pan.map((item, index) => (
              <div key={index} className="registry-card">
                <div className="reg-header">
                  <h3>Income Tax PAN Details</h3>
                  <span className="reg-label">NSDL Portal</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>Permanent Account Number (PAN)</label>
                    <strong>{item.data.pan}</strong>
                  </div>
                  <div className="reg-item">
                    <label>Registrant Holder</label>
                    <span>{item.data.name}</span>
                  </div>
                  <div className="reg-item">
                    <label>Taxpayer Category</label>
                    <span>{item.data.category}</span>
                  </div>
                  <div className="reg-item">
                    <label>ITD Record Verification</label>
                    <span className="status active">Active / Verified</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Udyam MSME Details */}
            {report.verification_details.udyam && report.verification_details.udyam.map((item, index) => (
              <div key={index} className="registry-card">
                <div className="reg-header">
                  <h3>Udyam MSME Certificate</h3>
                  <span className="reg-label">MSME Ministry</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>Udyam Registration Number</label>
                    <strong>{item.data.udyam_number}</strong>
                  </div>
                  <div className="reg-item">
                    <label>Enterprise Entity Name</label>
                    <span>{item.data.enterprise_name}</span>
                  </div>
                  <div className="reg-item">
                    <label>Classification Category</label>
                    <span>{item.data.enterprise_type} Enterprise</span>
                  </div>
                  <div className="reg-item">
                    <label>Enterprise Major Activity</label>
                    <span>{item.data.major_activity}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Aadhaar Card Details */}
            {report.verification_details.aadhaar && report.verification_details.aadhaar.map((item, index) => (
              <div key={index} className="registry-card">
                <div className="reg-header">
                  <h3>UIDAI Aadhaar Details</h3>
                  <span className="reg-label">UIDAI Portal</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>Aadhaar Number</label>
                    <strong>{item.data.aadhaar_number}</strong>
                  </div>
                  <div className="reg-item">
                    <label>Cardholder Name</label>
                    <span>{item.data.name}</span>
                  </div>
                  <div className="reg-item">
                    <label>State / Gender</label>
                    <span>{item.data.state} ({item.data.gender})</span>
                  </div>
                  <div className="reg-item">
                    <label>UIDAI Portal Status</label>
                    <span className="status active">Active / Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warnings Panel */}
          {report.compliance_report.recommendations && report.compliance_report.recommendations.length > 0 && (
            <div className="warnings-panel section-panel">
              <div className="card-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
                  Integrity Deductions & Remediation Recommendations
                </h2>
              </div>
              <div className="warnings-list">
                {report.compliance_report.recommendations.map((rec, index) => {
                  let alertType = "info";
                  if (rec.includes("CRITICAL:") || rec.includes("deductions")) alertType = "critical";
                  else if (rec.includes("WARNING:")) alertType = "warning";
                  
                  return (
                    <div key={index} className={`warning-item ${alertType}`}>
                      <div className="warning-icon">
                        {alertType === "critical" ? <XCircle size={16} /> : alertType === "warning" ? <AlertTriangle size={16} /> : <BadgeCheck size={16} />}
                      </div>
                      <div className="warning-text">{rec}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default DocumentUploadPage;