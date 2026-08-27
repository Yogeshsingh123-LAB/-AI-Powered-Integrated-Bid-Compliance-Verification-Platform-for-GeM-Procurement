import { useState, useEffect } from "react";
import profileImage from "../assets/profile.png";
import "../App.css";
import {
  LayoutDashboard,
  UserCircle,
  CloudUpload,
  FileText,
  Clock3,
  Bell,
  LogOut,
  Shield,
  User,
  FilePlus,
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sliders,
  Database,
  Users,
  Settings,
  ListFilter,
  Check,
  Plus
} from "lucide-react";

export default function Home({ role, onLogout }) {
  // Global Shared States (so they feel connected)
  const [tenders, setTenders] = useState([
    { id: "GEM/2026/001", title: "Catering Services for Office Delhi", budget: "₹15,00,000", docsRequired: "GST, PAN, MSME", status: "Active" },
    { id: "GEM/2026/002", title: "Supply of 500 Laptops (Core i7)", budget: "₹3,50,00,000", docsRequired: "GST, PAN, OEM Auth, ITR", status: "Active" },
    { id: "GEM/2026/003", title: "Office Security Upgrade", budget: "₹45,00,000", docsRequired: "GST, ISO Cert, MSME", status: "Closed" }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "2026-08-27 10:24:12", user: "Procurement Officer", action: "Created Tender GEM/2026/001", status: "Success" },
    { timestamp: "2026-08-27 11:15:30", user: "System Engine", action: "MSME Verification for Bidder 'Alpha Tech' passed", status: "Success" },
    { timestamp: "2026-08-27 12:02:44", user: "Admin", action: "Updated GST rule weight to 30%", status: "Info" }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: "Shweta Beelwal", role: "Procurement Officer", email: "shweta.b@gemprocurement.in", status: "Active" },
    { id: 2, name: "Yogesh Singh", role: "Admin", email: "admin@gemprocurement.in", status: "Active" },
    { id: 3, name: "Ramesh Kumar", role: "Procurement Officer", email: "ramesh.k@gemprocurement.in", status: "Suspended" }
  ]);

  const [rules, setRules] = useState([
    { id: "gst", name: "GSTIN Valid Match", weight: 30, active: true },
    { id: "pan", name: "PAN Verification Check", weight: 20, active: true },
    { id: "msme", name: "MSME/Udyam Registration", weight: 30, active: true },
    { id: "itr", name: "ITR Turn-over Validation", weight: 20, active: true }
  ]);

  const [apis, setApis] = useState([
    { id: "gst-api", name: "GSTIN Search Gateway", url: "https://api.gst.gov.in/v2/search", status: "Online" },
    { id: "income-tax-api", name: "PAN Card Validator API", url: "https://api.incometax.gov.in/pan", status: "Online" },
    { id: "udyam-api", name: "MSME Udyam Verify Gateway", url: "https://udyamregistration.gov.in/api", status: "Offline" }
  ]);

  // Active Navigation tab
  const [activeSection, setActiveSection] = useState("dashboard");

  // Reset active section if role changes
  useEffect(() => {
    setActiveSection("dashboard");
  }, [role]);

  // Sidebar navigation mapping based on role
  const navigationItems = role === "Admin" ? [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "rules", label: "Compliance Rules", icon: Sliders },
    { id: "apis", label: "API Configurations", icon: Database },
    { id: "settings", label: "System Settings", icon: Settings }
  ] : [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "createTender", label: "Create Tender", icon: FilePlus },
    { id: "uploadDocs", label: "Bidder Documents", icon: CloudUpload },
    { id: "verification", label: "Verification Suite", icon: Play },
    { id: "audit", label: "Audit Trail", icon: Clock3 }
  ];

  // Helper to append audit logs
  const addAuditLog = (action, status = "Success") => {
    const now = new Date();
    const timeStr = now.toISOString().replace("T", " ").substring(0, 19);
    setAuditLogs(prev => [
      { timestamp: timeStr, user: role, action, status },
      ...prev
    ]);
  };

  // Rendering matching sub-panels
  const renderContent = () => {
    if (role === "Admin") {
      switch (activeSection) {
        case "users":
          return <AdminUsers users={users} setUsers={setUsers} addAuditLog={addAuditLog} />;
        case "rules":
          return <AdminRules rules={rules} setRules={setRules} addAuditLog={addAuditLog} />;
        case "apis":
          return <AdminApis apis={apis} setApis={setApis} addAuditLog={addAuditLog} />;
        case "settings":
          return <AdminSettings addAuditLog={addAuditLog} />;
        case "dashboard":
        default:
          return <AdminDashboard users={users} rules={rules} apis={apis} />;
      }
    } else {
      switch (activeSection) {
        case "createTender":
          return <OfficerCreateTender tenders={tenders} setTenders={setTenders} addAuditLog={addAuditLog} />;
        case "uploadDocs":
          return <OfficerUploadDocs tenders={tenders} addAuditLog={addAuditLog} />;
        case "verification":
          return <OfficerVerification tenders={tenders} rules={rules} addAuditLog={addAuditLog} />;
        case "audit":
          return <OfficerAuditTrail auditLogs={auditLogs} />;
        case "dashboard":
        default:
          return <OfficerDashboard tenders={tenders} auditLogs={auditLogs} />;
      }
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-box">
            <Shield size={22} />
          </div>
          <div>
            <h2>GeM Compliance</h2>
            <p className="role-tag">{role.toUpperCase()}</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href="#"
              className={activeSection === id ? "active" : ""}
              onClick={(event) => {
                event.preventDefault();
                setActiveSection(id);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              <User size={17} />
            </div>
            <div>
              <strong>{role === "Admin" ? "Yogesh Singh" : "Shweta Beelwal"}</strong>
              <small>{role}</small>
            </div>
          </div>
          <button type="button" className="signout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <strong>GeM Portal</strong>
            <span>/</span>
            <span>{navigationItems.find((item) => item.id === activeSection)?.label || "Dashboard"}</span>
          </div>
          <div className="profile">
            <span className="role-indicator">{role}</span>
            <div className="profile-avatar">
              <img src={profileImage} alt="Profile" />
            </div>
            <strong>{role === "Admin" ? "Yogesh Singh" : "Shweta Beelwal"}</strong>
          </div>
        </header>

        <section className="content">{renderContent()}</section>
      </main>
    </div>
  );
}

/* ==================== SUBCOMPONENTS ==================== */

// 1. OFFICER DASHBOARD
function OfficerDashboard({ tenders, auditLogs }) {
  return (
    <div className="officer-dash animate-fade">
      <h1>Officer Dashboard Overview</h1>
      <p className="subtitle">Track bid processing, verify compliance matrices, and inspect audit trails.</p>
      
      <div className="stats-grid">
        <div className="stat-card blue">
          <p>ACTIVE TENDERS</p>
          <h2>{tenders.length}</h2>
          <span>📁</span>
        </div>
        <div className="stat-card green">
          <p>BIDDERS VERIFIED</p>
          <h2>18</h2>
          <span>✓</span>
        </div>
        <div className="stat-card orange">
          <p>PENDING REVIEW</p>
          <h2>03</h2>
          <span>⚠</span>
        </div>
        <div className="stat-card purple">
          <p>RECENT ACTIONS</p>
          <h2>{auditLogs.length}</h2>
          <span>⚡</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="applications-card">
          <h2>Active Tenders List</h2>
          <table>
            <thead>
              <tr>
                <th>Tender ID</th>
                <th>Tender Title</th>
                <th>Budget Limit</th>
                <th>Required Docs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((tender) => (
                <tr key={tender.id}>
                  <td><strong>{tender.id}</strong></td>
                  <td>{tender.title}</td>
                  <td>{tender.budget}</td>
                  <td>{tender.docsRequired}</td>
                  <td>
                    <span className={`status ${tender.status === "Active" ? "verified" : "review"}`}>
                      {tender.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="right-column">
          <div className="quick-actions">
            <h2>Portal Logins</h2>
            <div style={{ padding: "10px 0", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              Current User: <strong>Shweta Beelwal</strong><br/>
              Security Level: <strong>Level-2 Procurement</strong><br/>
              Active Session: <strong>Valid</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. OFFICER CREATE TENDER
function OfficerCreateTender({ tenders, setTenders, addAuditLog }) {
  const [tenderId, setTenderId] = useState("");
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [docs, setDocs] = useState("GST, PAN, MSME");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tenderId || !title || !budget) return;
    
    const newTender = {
      id: tenderId,
      title,
      budget,
      docsRequired: docs,
      status: "Active"
    };

    setTenders([newTender, ...tenders]);
    addAuditLog(`Created Tender ${tenderId}`);
    alert(`Tender ${tenderId} successfully created!`);
    setTenderId("");
    setTitle("");
    setBudget("");
  };

  return (
    <div className="create-tender-panel animate-fade">
      <h1>Create New Procurement Tender</h1>
      <p className="subtitle">Publish tenders and outline document checklist constraints for bidding organizations.</p>

      <div className="section-panel" style={{ maxWidth: "600px", padding: "30px" }}>
        <form onSubmit={handleSubmit} className="custom-dashboard-form">
          <div className="form-group">
            <label>Tender Reference Number *</label>
            <input 
              type="text" 
              placeholder="e.g. GEM/2026/045" 
              value={tenderId} 
              onChange={e => setTenderId(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Tender Title *</label>
            <input 
              type="text" 
              placeholder="e.g. Purchase of Air Conditioners for Headquarters" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Estimated Budget Limit (INR) *</label>
            <input 
              type="text" 
              placeholder="e.g. ₹20,00,000" 
              value={budget} 
              onChange={e => setBudget(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Required Verification Documents Checklist</label>
            <input 
              type="text" 
              value={docs} 
              onChange={e => setDocs(e.target.value)} 
            />
          </div>

          <button type="submit" className="neon-button">Publish Tender</button>
        </form>
      </div>
    </div>
  );
}

// 3. OFFICER UPLOAD DOCUMENTS
function OfficerUploadDocs({ tenders, addAuditLog }) {
  const [selectedTender, setSelectedTender] = useState(tenders[0]?.id || "");
  const [bidderName, setBidderName] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bidderName || !documentFile) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    const formData = new FormData();
    formData.append("file", documentFile);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
      const response = await fetch(`${apiUrl}/api/analyze`, { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "The document could not be analyzed.");
      }
      setAnalysis(payload);
      addAuditLog(`Analyzed compliance documents for Bidder '${bidderName}' under tender ${selectedTender}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="upload-docs-panel animate-fade">
      <h1>Upload Bidder Verification Documents</h1>
      <p className="subtitle">Upload certificates for automated OCR parsing and validation checks.</p>

      <div className="section-panel" style={{ maxWidth: "600px", padding: "30px" }}>
        <form onSubmit={handleUpload} className="custom-dashboard-form">
          <div className="form-group">
            <label>Select Target Tender</label>
            <select value={selectedTender} onChange={e => setSelectedTender(e.target.value)}>
              {tenders.map(t => (
                <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Bidding Organization Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Alpha Tech Industries" 
              value={bidderName} 
              onChange={e => setBidderName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Bidder Compliance Document (PDF)</label>
            <input 
              type="file" 
              accept="application/pdf,.pdf"
              onChange={e => setDocumentFile(e.target.files[0] || null)}
              required
            />
          </div>

          <button type="submit" className="neon-button" disabled={isAnalyzing}>
            {isAnalyzing ? "Analyzing PDF..." : "Upload and Analyze PDF"}
          </button>
          {error && <p className="status review" role="alert">{error}</p>}
        </form>
      </div>

      {analysis && (
        <div className="section-panel" style={{ maxWidth: "600px", padding: "30px", marginTop: "20px" }}>
          <h2>Analysis Result</h2>
          <p><strong>Bidder:</strong> {bidderName}</p>
          <p><strong>Score:</strong> {analysis.compliance_report.score}/100</p>
          <p><strong>Risk:</strong> {analysis.compliance_report.risk_level}</p>
          <p><strong>GSTIN:</strong> {analysis.extracted_identifiers.gstin.join(", ") || "Not found"}</p>
          <p><strong>PAN:</strong> {analysis.extracted_identifiers.pan.join(", ") || "Not found"}</p>
          <p><strong>Udyam:</strong> {analysis.extracted_identifiers.udyam.join(", ") || "Not found"}</p>
          {analysis.compliance_report.recommendations.map((recommendation) => (
            <p key={recommendation} className="subtitle">{recommendation}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. OFFICER VERIFICATION SUITE
function OfficerVerification({ tenders, rules, addAuditLog }) {
  const [selectedTender, setSelectedTender] = useState(tenders[0]?.id || "");
  const [selectedBidder, setSelectedBidder] = useState("Alpha Tech Pvt Ltd");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const startVerification = () => {
    setIsVerifying(true);
    setProgress(0);
    setLogs([]);
    setShowResult(false);

    const steps = [
      { text: "Initializing OCR Engine...", delay: 500 },
      { text: "Scanning GST details. Found Registration: 07AAAAA1111A1Z2...", delay: 1200 },
      { text: "Invoking government GST database validator API...", delay: 2000 },
      { text: "GST registration status: ACTIVE. Matching corporate identity...", delay: 2800 },
      { text: "Evaluating PAN registration status. Signature valid...", delay: 3500 },
      { text: "Calculating compliance score index based on configured rule weights...", delay: 4200 },
      { text: "Compliance evaluation complete!", delay: 4800 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, step.text]);
        setProgress(Math.floor(((idx + 1) / steps.length) * 100));
        if (idx === steps.length - 1) {
          setIsVerifying(false);
          setShowResult(true);
          addAuditLog(`Ran compliance verification for Bidder '${selectedBidder}' on tender ${selectedTender}`);
        }
      }, step.delay);
    });
  };

  const handleAction = (action) => {
    addAuditLog(`Manual status updated: Bidder '${selectedBidder}' ${action}ed`);
    alert(`Bidder ${action}ed successfully!`);
    setShowResult(false);
  };

  return (
    <div className="verification-panel animate-fade">
      <h1>AI Compliance Verification Suite</h1>
      <p className="subtitle">Execute AI rules check on uploaded bidder documents using government APIs.</p>

      <div className="dashboard-grid">
        <div className="applications-card" style={{ padding: "24px" }}>
          <h2>Select Verification Scope</h2>
          <div className="custom-dashboard-form" style={{ marginTop: "15px" }}>
            <div className="form-group">
              <label>Select Tender Reference</label>
              <select value={selectedTender} onChange={e => setSelectedTender(e.target.value)}>
                {tenders.map(t => (
                  <option key={t.id} value={t.id}>{t.id}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Bidder Organization</label>
              <select value={selectedBidder} onChange={e => setSelectedBidder(e.target.value)}>
                <option value="Alpha Tech Pvt Ltd">Alpha Tech Pvt Ltd</option>
                <option value="Global Solutions Corp">Global Solutions Corp</option>
                <option value="Dynamic Infrastructure">Dynamic Infrastructure</option>
              </select>
            </div>

            <button 
              onClick={startVerification} 
              disabled={isVerifying} 
              className="neon-button"
            >
              {isVerifying ? "Verifying..." : "Run AI Verification"}
            </button>
          </div>

          {/* Progress bar */}
          {(isVerifying || progress > 0) && (
            <div className="progress-section" style={{ marginTop: "30px" }}>
              <div className="progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                <span>AI compliance progress</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-bar-container" style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #0e7490, #06b6d4)", transition: "width 0.3s ease" }}></div>
              </div>
            </div>
          )}

          {/* Real-time Logs Console */}
          {logs.length > 0 && (
            <div className="console-logs" style={{ marginTop: "20px", background: "#02040a", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px", padding: "15px", fontFamily: "monospace", fontSize: "12px", height: "180px", overflowY: "auto", color: "#38bdf8" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: "8px" }}>CONSOLE LOG OUTPUT:</div>
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>&gt; {log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Result Scorecard */}
        <div className="right-column">
          {showResult ? (
            <div className="application-status animate-fade" style={{ background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6,182,212,0.3)" }}>
              <h2>Verification Scorecard</h2>
              <div className="circle" style={{ borderColor: "#06b6d4", color: "#06b6d4", boxShadow: "0 0 15px rgba(6,182,212,0.3)" }}>
                <div>88%</div>
              </div>
              <div style={{ textAlign: "center", fontSize: "14px", margin: "15px 0" }}>
                Status: <strong style={{ color: "#10b981" }}>COMPLIANT (PASS)</strong>
              </div>
              <div className="legend" style={{ fontSize: "12px", display: "grid", gap: "5px", color: "rgba(255,255,255,0.8)" }}>
                <div>✓ GST Registration: <strong style={{ color: "#10b981" }}>VALID</strong></div>
                <div>✓ PAN verification: <strong style={{ color: "#10b981" }}>MATCHED</strong></div>
                <div>✓ MSME checklist: <strong style={{ color: "#10b981" }}>COMPLIANT</strong></div>
                <div>⚠ ITR filing status: <strong style={{ color: "#f59e0b" }}>MARGINAL</strong></div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button 
                  onClick={() => handleAction("Approve")} 
                  className="neon-button" 
                  style={{ background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.3)", flex: 1, marginTop: 0 }}
                >
                  Approve Bid
                </button>
                <button 
                  onClick={() => handleAction("Reject")} 
                  className="neon-button" 
                  style={{ background: "#ef4444", boxShadow: "0 0 10px rgba(239,68,68,0.3)", flex: 1, marginTop: 0 }}
                >
                  Reject Bid
                </button>
              </div>
            </div>
          ) : (
            <div className="quick-actions">
              <h2>Awaiting Command</h2>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                Select a bidder profile and run the AI scanner to generate compliance scores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 5. OFFICER AUDIT TRAIL
function OfficerAuditTrail({ auditLogs }) {
  return (
    <div className="audit-trail-panel animate-fade">
      <h1>Audit Trail Logs</h1>
      <p className="subtitle">Immutable logging history of verification events and compliance actions.</p>

      <div className="applications-card" style={{ padding: "20px" }}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Triggered By</th>
              <th>Action Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, index) => (
              <tr key={index}>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{log.timestamp}</td>
                <td><strong>{log.user}</strong></td>
                <td>{log.action}</td>
                <td>
                  <span className={`status ${log.status === "Success" ? "verified" : "review"}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. ADMIN DASHBOARD
function AdminDashboard({ users, rules, apis }) {
  const activeApis = apis.filter(a => a.status === "Online").length;
  const activeUsers = users.filter(u => u.status === "Active").length;

  return (
    <div className="admin-dash animate-fade">
      <h1>Admin Command Centre</h1>
      <p className="subtitle">Manage security policies, configure AI engines, monitor system APIs, and view logs.</p>

      <div className="stats-grid">
        <div className="stat-card blue">
          <p>TOTAL GATEWAYS</p>
          <h2>{apis.length}</h2>
          <span>🔌</span>
        </div>
        <div className="stat-card green">
          <p>ACTIVE RULES</p>
          <h2>{rules.filter(r => r.active).length}</h2>
          <span>✓</span>
        </div>
        <div className="stat-card orange">
          <p>API STATUS</p>
          <h2>{activeApis}/{apis.length} Online</h2>
          <span>⚡</span>
        </div>
        <div className="stat-card purple">
          <p>SYSTEM USERS</p>
          <h2>{activeUsers} Active</h2>
          <span>👥</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="applications-card">
          <h2>System Performance & Connected APIs</h2>
          <table style={{ marginTop: "15px" }}>
            <thead>
              <tr>
                <th>API Connection</th>
                <th>Endpoint URI</th>
                <th>Latency Status</th>
              </tr>
            </thead>
            <tbody>
              {apis.map(api => (
                <tr key={api.id}>
                  <td><strong>{api.name}</strong></td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{api.url}</td>
                  <td>
                    <span className={`status ${api.status === "Online" ? "verified" : "review"}`}>
                      {api.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="right-column">
          <div className="quick-actions">
            <h2>Server Status Indicators</h2>
            <div style={{ display: "grid", gap: "10px", fontSize: "13px", marginTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Core Engine Server:</span>
                <strong style={{ color: "#10b981" }}>ONLINE</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>AI OCR Parser Node:</span>
                <strong style={{ color: "#10b981" }}>HEALTHY</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Database Sync Time:</span>
                <strong style={{ color: "#06b6d4" }}>12ms latency</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. ADMIN MANAGE USERS
function AdminUsers({ users, setUsers, addAuditLog }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("Procurement Officer");

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser = {
      id: Date.now(),
      name,
      role: userRole,
      email,
      status: "Active"
    };

    setUsers([...users, newUser]);
    addAuditLog(`Created system user '${name}' with role ${userRole}`);
    alert(`User ${name} successfully added!`);
    setName("");
    setEmail("");
  };

  const toggleStatus = (id, currentStatus, userName) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    setUsers(users.map(u => u.id === id ? { ...u, status: nextStatus } : u));
    addAuditLog(`Toggled user status of '${userName}' to ${nextStatus}`);
  };

  return (
    <div className="admin-users animate-fade">
      <h1>User Policy Management</h1>
      <p className="subtitle">Delegate credentials and toggle portal access permissions for corporate security.</p>

      <div className="dashboard-grid">
        <div className="applications-card">
          <h2>Active Platform Credentials</h2>
          <table style={{ marginTop: "15px" }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Email Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status ${user.status === "Active" ? "verified" : "review"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(user.id, user.status, user.name)} 
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", color: "#ffffff", cursor: "pointer" }}
                    >
                      {user.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="right-column">
          <div className="quick-actions" style={{ padding: "20px" }}>
            <h2>Add Access Credentials</h2>
            <form onSubmit={handleAddUser} className="custom-dashboard-form" style={{ marginTop: "15px" }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="e.g. ramesh@gem.gov.in" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>User Role Scope</label>
                <select value={userRole} onChange={e => setUserRole(e.target.value)}>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="neon-button" style={{ width: "100%" }}>Add User Account</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. ADMIN COMPLIANCE RULES
function AdminRules({ rules, setRules, addAuditLog }) {
  const updateWeight = (id, newWeight) => {
    const val = parseInt(newWeight) || 0;
    setRules(rules.map(r => r.id === id ? { ...r, weight: val } : r));
  };

  const handleSave = () => {
    const total = rules.reduce((acc, r) => acc + r.weight, 0);
    if (total !== 100) {
      alert(`Warning: Total weights equal ${total}%. Standard weights must total exactly 100%.`);
      return;
    }
    addAuditLog(`Reconfigured compliance engine weights: ${rules.map(r => `${r.name}: ${r.weight}%`).join(", ")}`);
    alert("Compliance rules configuration saved successfully!");
  };

  return (
    <div className="admin-rules animate-fade">
      <h1>AI Compliance Rules Configuration</h1>
      <p className="subtitle">Customize weights and algorithms determining automated compliance scores.</p>

      <div className="section-panel" style={{ maxWidth: "600px", padding: "30px" }}>
        <h2>Configure Score Weights</h2>
        <div style={{ margin: "15px 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
          The total summation of rule weights must equal exactly <strong>100%</strong>.
        </div>

        <div className="custom-dashboard-form">
          {rules.map(rule => (
            <div className="form-group" key={rule.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <label style={{ margin: 0, flex: 2 }}>{rule.name}</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                <input 
                  type="number" 
                  value={rule.weight} 
                  onChange={e => updateWeight(rule.id, e.target.value)} 
                  style={{ width: "80px", textAlign: "right" }} 
                />
                <span style={{ color: "#06b6d4" }}>%</span>
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "15px 0", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>Total Weight Accumulation:</span>
            <span style={{ color: rules.reduce((acc, r) => acc + r.weight, 0) === 100 ? "#10b981" : "#ef4444" }}>
              {rules.reduce((acc, r) => acc + r.weight, 0)}%
            </span>
          </div>

          <button onClick={handleSave} className="neon-button">Save Rules Configuration</button>
        </div>
      </div>
    </div>
  );
}

// 9. ADMIN API CONFIGS
function AdminApis({ apis, setApis, addAuditLog }) {
  const toggleApiStatus = (id, currentStatus, name) => {
    const nextStatus = currentStatus === "Online" ? "Offline" : "Online";
    setApis(apis.map(a => a.id === id ? { ...a, status: nextStatus } : a));
    addAuditLog(`Toggled API Endpoint '${name}' to ${nextStatus}`);
  };

  return (
    <div className="admin-apis animate-fade">
      <h1>API Gateway Settings</h1>
      <p className="subtitle">Register endpoints and manage connections to central government registry services.</p>

      <div className="applications-card" style={{ padding: "20px" }}>
        <h2>Government Verification Channels</h2>
        <table style={{ marginTop: "15px" }}>
          <thead>
            <tr>
              <th>Integration Module</th>
              <th>Endpoint Connection Address</th>
              <th>Ping Status</th>
              <th>Toggle Connection</th>
            </tr>
          </thead>
          <tbody>
            {apis.map(api => (
              <tr key={api.id}>
                <td><strong>{api.name}</strong></td>
                <td style={{ fontFamily: "monospace", fontSize: "12px", color: "#a5f3fc" }}>{api.url}</td>
                <td>
                  <span className={`status ${api.status === "Online" ? "verified" : "review"}`}>
                    {api.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => toggleApiStatus(api.id, api.status, api.name)} 
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", padding: "4px 8px", fontSize: "11px", color: "#ffffff", cursor: "pointer" }}
                  >
                    {api.status === "Online" ? "Disconnect" : "Connect"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 10. ADMIN SYSTEM SETTINGS
function AdminSettings({ addAuditLog }) {
  const [captchaDiff, setCaptchaDiff] = useState("Medium");
  const [timeout, setTimeoutVal] = useState("30 mins");

  const handleSave = () => {
    addAuditLog(`Saved global system config: Captcha difficulty: ${captchaDiff}, Session Timeout: ${timeout}`);
    alert("Global system settings saved successfully!");
  };

  return (
    <div className="admin-settings animate-fade">
      <h1>Portal Security Settings</h1>
      <p className="subtitle">Configure automated protection rules and session timeout constraints.</p>

      <div className="section-panel" style={{ maxWidth: "600px", padding: "30px" }}>
        <div className="custom-dashboard-form">
          <div className="form-group">
            <label>Auto-Session Timeout duration</label>
            <select value={timeout} onChange={e => setTimeoutVal(e.target.value)}>
              <option value="15 mins">15 minutes</option>
              <option value="30 mins">30 minutes</option>
              <option value="60 mins">60 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bot Captcha Validation Complexity</label>
            <select value={captchaDiff} onChange={e => setCaptchaDiff(e.target.value)}>
              <option value="Easy">Easy (Numeric 4-digits)</option>
              <option value="Medium">Medium (Alphanumeric 5-char)</option>
              <option value="Hard">Hard (Case-sensitive 6-char)</option>
            </select>
          </div>

          <button onClick={handleSave} className="neon-button">Apply Global Configurations</button>
        </div>
      </div>
    </div>
  );
}