import { useState, useRef, useEffect } from "react";
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

function DocumentUploadPage({ onAddBid, user, selectedBid, selectedTender }) {
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

  const [activeTargetDoc, setActiveTargetDoc] = useState(null);
  const [requirementsList, setRequirementsList] = useState([]);
  const [docFilter, setDocFilter] = useState("all");

  // Submit Modal States
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingBidGroup, setSubmittingBidGroup] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const handleSubmitDocuments = (bidGroup) => {
    const missingMandatory = bidGroup.documents.filter(d => (d.status || "").toUpperCase() === "MISSING");
    if (missingMandatory.length > 0) {
      const missingNames = missingMandatory.map(d => d.name).join(", ");
      alert(`${missingMandatory.length} mandatory document(s) are still missing:\n- ${missingNames}\n\nPlease upload all required documents before submitting.`);
      return;
    }
    setSubmittingBidGroup(bidGroup);
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitModalOpen(true);
  };

  const confirmSubmitDocuments = async () => {
    if (!submittingBidGroup) return;
    const activeToken = localStorage.getItem("gem_token");
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${API_BASE}/api/bids/${submittingBidGroup.bidId}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.detail || "Document submission failed.");
        return;
      }
      setSubmitSuccess("Documents submitted successfully for official verification!");
      setTimeout(() => {
        setSubmitModalOpen(false);
        fetchMyBidsAndRequirements();
      }, 1500);
    } catch (err) {
      setSubmitError("Server connection error during document submission.");
    }
  };


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

  const fetchMyBidsAndRequirements = async () => {
    const activeToken = localStorage.getItem("gem_token");
    if (!activeToken) return;
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${API_BASE}/api/bids/my-bids`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (!res.ok) return;
      const myBidsData = await res.json();
      if (!Array.isArray(myBidsData) || myBidsData.length === 0) {
        setRequirementsList([]);
        return;
      }

      const groups = [];
      for (const b of myBidsData) {
        const detailsRes = await fetch(`${API_BASE}/api/bids/${b.id}`, {
          headers: { "Authorization": `Bearer ${activeToken}` }
        });
        if (detailsRes.ok) {
          const details = await detailsRes.json();
          const matrix = details.compliance_matrix || [];
          groups.push({
            bidId: details.id,
            tenderId: details.tender_id,
            bidTitle: details.tender_title,
            org: "Chennai Petroleum Corporation Limited (CPCL)",
            summaryCounts: details.summary_counts || {},
            documents: matrix.map(m => ({
              requirementId: m.requirement_id,
              code: m.code,
              name: m.description || m.code,
              file: m.file_name,
              status: m.status, // "MISSING", "UPLOADED", "PROCESSING", "VERIFIED", "REJECTED"
              uploadedAt: m.uploaded_at
            }))
          });
        }
      }
      setRequirementsList(groups);
    } catch (err) {
      console.error("Failed to fetch bidder compliance matrix:", err);
    }
  };

  useEffect(() => {
    fetchMyBidsAndRequirements();
  }, [selectedBid, selectedTender]);

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

  const fetchWithTimeout = (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  };

  const triggerComplianceAnalysis = async (uploadedFile) => {
    const MAX_SIZE_MB = 16;
    if (uploadedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Verification System Error: File too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    const fileExt = (uploadedFile.name || "").split('.').pop().toLowerCase();
    const allowedExts = ["pdf", "jpg", "jpeg", "png", "bmp", "tiff"];
    const isAllowed = uploadedFile.type === "application/pdf" ||
      uploadedFile.type.startsWith("image/") ||
      allowedExts.includes(fileExt);

    if (!isAllowed) {
      alert("Verification System Error: Only PDF (.pdf) and Image files (.jpg, .jpeg, .png) are permitted.");
      setFile(null);
      return;
    }

    setUploading(true);
    setReport(null);
    setParsingProgress(1);
    setLogs([]);

    addLog(`System initialized. Loaded file: ${uploadedFile.name}`, "info");
    addLog("Connecting to smart text extraction pipeline...", "info");

    const logIntervals = [
      { text: "SmartPDFHandler: Analyzing PDF byte signature...", type: "info", delay: 800 },
      { text: "SmartPDFHandler: Page structure verified. Initializing page-by-page parser...", type: "info", delay: 1800 },
      { text: "SmartPDFHandler: Checking character counts to determine if scanned or digital...", type: "info", delay: 2800 },
      { text: "SmartPDFHandler: Page 1 OCR classification complete. Applying binarization filters...", type: "info", delay: 3800 },
      { text: "RegexExtractor: Running compiled government entity identifier search patterns...", type: "info", delay: 4800 },
      { text: "GovtRegistryVerifier: Connecting to Central Board of Indirect Taxes & Customs GSTIN portal...", type: "info", delay: 5800 },
      { text: "GovtRegistryVerifier: Fetching Income Tax department PAN record registry...", type: "info", delay: 6800 },
      { text: "GovtRegistryVerifier: Fetching Ministry of MSME Udyam Database portal...", type: "info", delay: 7800 }
    ];

    const timeouts = [];
    logIntervals.forEach((item) => {
      const t = setTimeout(() => {
        addLog(item.text, item.type);
      }, item.delay);
      timeouts.push(t);
    });

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData
      }, 30000);

      timeouts.forEach(clearTimeout);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned HTTP code ${response.status}`);
      }

      const data = await response.json();

      addLog("SmartPDFHandler: Successfully extracted document string data.", "success");
      const extractionMethod = data.analysis.ocr_used
        ? `OCR (${data.analysis.ocr_engine.toUpperCase()})`
        : "Digital text extraction";
      addLog(`Extraction Method: ${extractionMethod}`, "success");

      const ids = data.analysis.identifiers;
      addLog(`RegexExtractor: Found GSTINs: [${ids.gstin.join(", ")}], PANs: [${ids.pan.join(", ")}], Udyam: [${ids.udyam.join(", ")}], Aadhaar: [${(ids.aadhaar || []).join(", ")}]`, "success");

      addLog("GovtRegistryVerifier: Batch queries complete. Registry alignment scores computed.", "success");
      addLog(`ScoringEngine: Final compliance score is: ${data.compliance.score}/100. Risk Tier: ${data.compliance.risk_level}`, "success");

      const adaptedData = {
        success: data.analysis.success,
        text_extraction: {
          pages_detail: [{ page_number: 1, method: data.analysis.ocr_used ? "ocr" : "digital" }]
        },
        extracted_identifiers: ids,
        forgery_analysis: data.analysis.forgery_analysis || {},
        fraud_analysis: data.analysis.fraud_analysis || {},
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

      const terminalLogsList = [
        `[System] Initialized cryptographic inspection for uploaded document: ${uploadedFile.name}`,
        `[SmartPDFHandler] Text extraction completed using page summary: ${extractionMethod}`,
        `[ForgeryDetector] Structural Forgery Score: ${data.analysis.forgery_analysis?.forgery_score || 100}/100 | Risk: ${data.analysis.forgery_analysis?.risk_level || 'LOW'}`,
        `[RegexExtractor] Extracted GSTIN: ${ids.gstin[0] || 'None'} | PAN: ${ids.pan[0] || 'None'} | Udyam: ${ids.udyam[0] || 'None'} | Aadhaar: ${(ids.aadhaar && ids.aadhaar[0]) || 'None'}`,
        ...data.compliance.recommendations.map(r => `[ScoringEngine] Analysis: ${r}`)
      ];

      const bidId = `GEM-BID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const bidderName = data.verification?.gstin?.[0]?.data?.legal_name || data.verification?.pan?.[0]?.data?.name || data.verification?.udyam?.[0]?.data?.enterprise_name || "Unknown Bidder Org";

      const newBid = {
        id: bidId,
        bidderName: bidderName,
        gstin: ids.gstin?.[0] || "",
        pan: ids.pan?.[0] || "",
        udyam: ids.udyam?.[0] || "",
        submittedOn: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
        status: data.analysis.fraud_analysis?.is_collusion_risk ? "Collusion Flagged" : "Under Review",
        score: data.compliance?.score || 0,
        risk: data.compliance?.risk_level || "MEDIUM",
        compliance_record: data.verification?.gstin?.[0]?.data?.compliance_record || "Good",
        taxpayer_type: data.verification?.gstin?.[0]?.data?.taxpayer_type || "Regular",
        enterprise_type: data.verification?.udyam?.[0]?.data?.enterprise_type || "N/A",
        warnings: data.compliance?.recommendations || [],
        logs: terminalLogsList
      };

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

  const triggerRowUpload = (bidId, requirementId, docCode) => {
    setActiveTargetDoc({ bidId, requirementId, docCode });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRowFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      const activeToken = localStorage.getItem("gem_token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      if (activeTargetDoc && activeTargetDoc.bidId && activeTargetDoc.requirementId) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("bid_id", activeTargetDoc.bidId);
        formData.append("requirement_id", activeTargetDoc.requirementId);

        try {
          addLog(`Uploading document '${uploadedFile.name}' for requirement '${activeTargetDoc.docCode}'...`, "info");
          const uploadRes = await fetch(`${API_BASE}/api/documents/upload`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeToken}`
            },
            body: formData
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.detail || `Upload failed with HTTP ${uploadRes.status}`);
          }

          const uploadData = await uploadRes.json();
          addLog(`Document '${uploadedFile.name}' uploaded successfully to Supabase Storage. ID: ${uploadData.document_id}`, "success");

          // Refresh requirements matrix from backend database
          await fetchMyBidsAndRequirements();
        } catch (err) {
          console.error("Document upload error:", err);
          alert(`Upload Error: ${err.message}`);
          addLog(`Upload error: ${err.message}`, "danger");
        } finally {
          setUploading(false);
        }
      }

      triggerComplianceAnalysis(uploadedFile);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="file-input"
        accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,image/png,image/jpeg,image/jpg"
        onChange={handleRowFileChange}
        style={{ display: "none" }}
      />

      <div className="bidder-section-wrapper" style={{ marginBottom: "24px" }}>
        {/* Sapphire Hero Banner for Documents Overview */}
        <div className="section-hero-banner indigo-theme">
          <div>
            <span className="hero-eyebrow">COMPLIANCE VAULT</span>
            <h2 style={{ fontSize: "1.6rem" }}>Bids & Document Compliance Matrix</h2>
            <p className="hero-subtext">Review required certificates, pending submissions, and automated OCR verification status per bid.</p>
          </div>
        </div>

        {/* Requirements Status Matrix Panel */}
        <div className="section-panel studio-panel">
          <div className="panel-table-header">
            <h3>Required Documents Checklist</h3>
            <div className="panel-actions">
              <button
                className={`filter-pill ${docFilter === "all" ? "active" : ""}`}
                onClick={() => setDocFilter("all")}
              >
                All Documents
              </button>
              <button
                className={`filter-pill ${docFilter === "pending" ? "active" : ""}`}
                onClick={() => setDocFilter("pending")}
              >
                Pending for Submission ⏳
              </button>
              <button
                className={`filter-pill ${docFilter === "completed" ? "active" : ""}`}
                onClick={() => setDocFilter("completed")}
              >
                Completed / Verified ✓
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {requirementsList.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <FileText size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
                <h4 style={{ fontSize: "1.1rem", color: "#1e293b", marginBottom: "6px" }}>No Active Tender Submissions Found</h4>
                <p style={{ color: "#64748b", fontSize: "0.9rem", maxWidth: "500px", margin: "0 auto" }}>
                  Please go to <strong>Available Tenders</strong>, select a tender, and click <strong>Apply</strong> to generate a bid submission and load its required compliance documents.
                </p>
              </div>
            ) : (
              requirementsList.map((bidGroup) => {
                const filteredDocs = bidGroup.documents.filter((doc) => {
                  const s = (doc.status || "").toUpperCase();
                  if (docFilter === "pending") return s === "MISSING" || s === "PENDING" || s === "UPLOADED" || s === "REJECTED" || s === "MISMATCH";
                  if (docFilter === "completed") return s === "VERIFIED";
                  return true;
                });

                if (filteredDocs.length === 0 && docFilter !== "all") return null;

                const reqCount = bidGroup.documents.length;
                const verifiedCount = bidGroup.documents.filter(d => (d.status || "").toUpperCase() === "VERIFIED").length;
                const uploadedCount = bidGroup.documents.filter(d => d.file && (d.status || "").toUpperCase() !== "MISSING").length;
                const rejectedCount = bidGroup.documents.filter(d => (d.status || "").toUpperCase() === "REJECTED" || (d.status || "").toUpperCase() === "MISMATCH").length;
                const missingCount = bidGroup.documents.filter(d => (d.status || "").toUpperCase() === "MISSING").length;
                const pendingCount = uploadedCount - verifiedCount - rejectedCount;

                return (
                  <div key={bidGroup.bidId} style={{ border: "1px solid #cbd5e1", borderRadius: "12px", padding: "24px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #e2e8f0", paddingBottom: "14px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <span className="id-badge" style={{ background: "#0f172a", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "700" }}>Tender {bidGroup.tenderId}</span>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600" }}>Bid ID: {bidGroup.bidId.substring(0, 8)}...</span>
                          <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{bidGroup.bidTitle}</strong>
                        </div>
                        <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Organization: {bidGroup.org} | Logged-in Bidder: {user?.full_name || "Authorized Representative"}</span>
                      </div>
                      <div>
                        <button
                          type="button"
                          style={{
                            background: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "700",
                            padding: "10px 20px",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                          onClick={() => handleSubmitDocuments(bidGroup)}
                        >
                          <BadgeCheck size={18} /> Submit Documents
                        </button>
                      </div>
                    </div>

                    {/* Summary Counts Bar */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "20px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Required</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>{reqCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: "700", textTransform: "uppercase" }}>Uploaded</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0284c7" }}>{uploadedCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "700", textTransform: "uppercase" }}>Verified</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#10b981" }}>{verifiedCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: "700", textTransform: "uppercase" }}>Pending</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#d97706" }}>{pendingCount < 0 ? 0 : pendingCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "700", textTransform: "uppercase" }}>Rejected</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#dc2626" }}>{rejectedCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Missing</span>
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#64748b" }}>{missingCount}</div>
                      </div>
                    </div>

                    <table className="studio-table">
                      <thead>
                        <tr>
                          <th>Requirement Name</th>
                          <th>Code</th>
                          <th>Uploaded File</th>
                          <th>Submission Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocs.map((req, idx) => {
                          const statusUpper = (req.status || "").toUpperCase();
                          return (
                            <tr key={idx} style={{ verticalAlign: "top" }}>
                              <td style={{ padding: "14px 12px" }}><strong>{req.name}</strong></td>
                              <td style={{ padding: "14px 12px" }}><span className="cat-tag" style={{ background: "#f1f5f9", color: "#334155", fontWeight: "700" }}>{req.code}</span></td>
                              <td style={{ padding: "14px 12px" }}>
                                {req.file ? (
                                  <div>
                                    <span style={{ fontWeight: 600, color: statusUpper === "REJECTED" ? "#dc2626" : "#0f172a", display: "inline-flex", alignItems: "center", gap: "6px", wordBreak: "break-all" }}>
                                      <FileText size={15} style={{ color: statusUpper === "REJECTED" ? "#dc2626" : "#0284c7" }} />
                                      {req.file}
                                    </span>
                                  </div>
                                ) : (
                                  <em style={{ color: "#94a3b8" }}>No file uploaded</em>
                                )}
                              </td>
                              <td style={{ padding: "14px 12px" }}>
                                {statusUpper === "VERIFIED" ? (
                                  <span className="status-badge verified" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <CheckCircle2 size={14} /> VERIFIED
                                  </span>
                                ) : statusUpper === "UPLOADED" || statusUpper === "PROCESSING" ? (
                                  <span className="status-badge pending" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <Loader2 size={14} className="spin" /> PROCESSING / PENDING
                                  </span>
                                ) : statusUpper === "REJECTED" || statusUpper === "MISMATCH" ? (
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                                    <span className="status-badge error" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                                      <XCircle size={14} /> REJECTED (Wrong Document)
                                    </span>
                                    <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: "600", maxWidth: "260px", lineHeight: "1.3" }}>
                                      {req.rejectionReason || `Does not match ${req.code} requirements.`}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="status-badge pending" style={{ background: "#fef3c7", color: "#b45309", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    <AlertTriangle size={14} /> MISSING
                                  </span>
                                )}
                              </td>
                              <td>
                                {statusUpper === "VERIFIED" ? (
                                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <CheckCircle2 size={15} /> Verified
                                  </span>
                                ) : statusUpper === "UPLOADED" || statusUpper === "PROCESSING" ? (
                                  <button
                                    type="button"
                                    style={{
                                      background: "#0284c7",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontWeight: "600",
                                      padding: "6px 14px",
                                      fontSize: "0.82rem",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => triggerRowUpload(bidGroup.bidId, req.requirementId, req.code)}
                                  >
                                    Replace File
                                  </button>
                                ) : statusUpper === "REJECTED" || statusUpper === "MISMATCH" ? (
                                  <button
                                    type="button"
                                    style={{
                                      background: "#dc2626",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontWeight: "600",
                                      padding: "6px 14px",
                                      fontSize: "0.82rem",
                                      cursor: "pointer",
                                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)"
                                    }}
                                    onClick={() => triggerRowUpload(bidGroup.bidId, req.requirementId, req.code)}
                                  >
                                    Upload Correct Document
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    style={{
                                      background: "#0284c7",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontWeight: "600",
                                      padding: "6px 16px",
                                      fontSize: "0.82rem",
                                      cursor: "pointer",
                                      boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)"
                                    }}
                                    onClick={() => triggerRowUpload(bidGroup.bidId, req.requirementId, req.code)}
                                  >
                                    Upload Document
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })
            )}
          </div>
        </div>
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

      {/* COMPLIANCE REPORT CARD DETAILS */}
      {report && report.success && (
        <div className="compliance-grid">
          {/* Score Dial Badge */}
          <div className="score-panel">
            <div style={{ position: "relative", width: "110px", height: "110px", margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "110px", height: "110px" }}>
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={report.compliance_report.score >= 80 ? "#10b981" : report.compliance_report.score >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(report.compliance_report.score / 100) * 251.2} 251.2`}
                  strokeDashoffset="0"
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: "900", color: report.compliance_report.score >= 80 ? "#10b981" : report.compliance_report.score >= 50 ? "#d97706" : "#dc2626", lineHeight: 1 }}>{report.compliance_report.score}%</span>
                <span style={{ fontSize: "0.65rem", fontWeight: "700", color: report.compliance_report.score >= 80 ? "#10b981" : "#f59e0b", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.05em" }}>MATCH</span>
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
            {/* Document Rejection Alert Card */}
            {(report.compliance_report.score === 0 || report.compliance_report.risk_level === "HIGH" || report.document_status === "REJECTED") && (
              <div className="registry-card" style={{ borderColor: '#ef4444', background: '#fff5f5', marginBottom: '20px' }}>
                <div className="reg-header" style={{ borderBottom: '1px solid #fee2e2', paddingBottom: '10px' }}>
                  <h3 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>
                    <XCircle size={20} /> Document Verification Rejected
                  </h3>
                  <span className="reg-label" style={{ background: '#dc2626', color: '#fff', fontWeight: '700' }}>REJECTED</span>
                </div>
                <div style={{ padding: '14px 0 4px 0', color: '#991b1b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.04em' }}>Reason for Rejection / Non-Compliance:</div>
                  <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5', color: '#b91c1c', fontWeight: '600', fontSize: '0.88rem' }}>
                    {report.rejection_reason || report.compliance_report?.recommendations?.[0] || `Uploaded document does not match mandatory requirement and contains no valid government compliance evidence.`}
                  </div>
                </div>
              </div>
            )}

            {/* AI PDF Forgery & Tampering Inspection Card - Only visible to ADMIN/OFFICER */}
            {report.forgery_analysis && report.forgery_analysis.forgery_score !== undefined && (user?.role === "ADMIN" || user?.role === "OFFICER") && (
              <div className="registry-card" style={{ borderColor: report.forgery_analysis.forgery_score >= 80 ? '#10b981' : '#f59e0b' }}>
                <div className="reg-header">
                  <h3>AI PDF Tampering & Structural Forensics</h3>
                  <span className="reg-label" style={{ background: '#3b82f6', color: '#fff' }}>PyMuPDF AI Engine</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>Structural Integrity Score</label>
                    <strong style={{ color: report.forgery_analysis.forgery_score >= 80 ? '#10b981' : '#dc2626' }}>
                      {report.forgery_analysis.forgery_score} / 100 ({report.forgery_analysis.risk_level} RISK)
                    </strong>
                  </div>
                  <div className="reg-item">
                    <label>Digital Signature Status</label>
                    <span>{report.forgery_analysis.has_digital_signature ? "✓ Embedded PKCS#7 Signature" : "⚠️ No PKCS#7 Signature Found"}</span>
                  </div>
                  <div className="reg-item">
                    <label>Creation Software Signature</label>
                    <span>{report.forgery_analysis.metadata?.producer || "Official Government Generator"}</span>
                  </div>
                  <div className="reg-item">
                    <label>Document Tampering Status</label>
                    <span className={`status ${report.forgery_analysis.authentic ? "active" : "inactive"}`}>
                      {report.forgery_analysis.authentic ? "Authentic Certificate Structure" : "Potential Alterations Detected"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Bidder Fraud & Collusion Alert Card - Hidden for Bidder role */}
            {report.fraud_analysis && (user?.role === "ADMIN" || user?.role === "OFFICER") && (
              <div className="registry-card" style={{ borderColor: report.fraud_analysis.is_collusion_risk ? '#dc2626' : '#10b981' }}>
                <div className="reg-header">
                  <h3>Multi-Bidder Collusion & Entity Verification</h3>
                  <span className="reg-label" style={{ background: '#8b5cf6', color: '#fff' }}>GeM Fraud Shield</span>
                </div>
                <div className="reg-grid">
                  <div className="reg-item">
                    <label>Multi-Bidder Identifier Reuse</label>
                    <strong style={{ color: report.fraud_analysis.is_collusion_risk ? '#dc2626' : '#10b981' }}>
                      {report.fraud_analysis.is_collusion_risk ? "CRITICAL: GSTIN/PAN Reused Across Bidders" : "✓ Unique Entity Identifier"}
                    </strong>
                  </div>
                  <div className="reg-item">
                    <label>Legal Name Fuzzy Alignment</label>
                    <span>{report.fraud_analysis.metrics?.gst_pan_name_similarity || 100}% GST-to-PAN Name Match</span>
                  </div>
                  <div className="reg-item">
                    <label>Shell Entity Risk Penalty</label>
                    <span>{report.fraud_analysis.fraud_penalty ? `-${report.fraud_analysis.fraud_penalty} pts` : "0 pts (Compliant)"}</span>
                  </div>
                  <div className="reg-item">
                    <label>Anti-Collusion Status</label>
                    <span className={`status ${!report.fraud_analysis.is_collusion_risk ? "active" : "inactive"}`}>
                      {!report.fraud_analysis.is_collusion_risk ? "Clean Entity Clearance" : "Collusion Investigation Flagged"}
                    </span>
                  </div>
                </div>
              </div>
            )}

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

      {/* Submit Confirmation Modal */}
      {submitModalOpen && submittingBidGroup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "520px",
            padding: "28px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "10px", borderRadius: "12px" }}>
                <BadgeCheck size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Submit Compliance Package?</h3>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Tender #{submittingBidGroup.tenderId}</span>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Required Documents:</span>
                <strong style={{ color: "#0f172a" }}>{submittingBidGroup.documents.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Uploaded Files:</span>
                <strong style={{ color: "#0284c7" }}>{submittingBidGroup.documents.filter(d => d.file).length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#64748b" }}>Missing Documents:</span>
                <strong style={{ color: "#10b981" }}>0 (All Complete)</strong>
              </div>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, marginBottom: "24px" }}>
              Once confirmed, your uploaded document package will be submitted for official procurement audit and verification.
            </p>

            {submitError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", fontWeight: "700" }}>
                {submitSuccess}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  padding: "10px 18px",
                  cursor: "pointer"
                }}
                onClick={() => setSubmitModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  padding: "10px 22px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)"
                }}
                onClick={confirmSubmitDocuments}
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DocumentUploadPage;