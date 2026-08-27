import { useState } from "react";
import profileImage from "../assets/profile.png";
import "../App.css";
import DocumentUploadPage from "./DocumentUpload";
import StatusPage from "./Status";
import {
  LayoutDashboard,
  UserCircle,
  CloudUpload,
  Clock3,
  Bell,
  LifeBuoy,
  LogOut,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  FileCheck2,
  HelpCircle,
  BookOpen
} from "lucide-react";

// Mock Database of submitted bids (visible globally to allow live sync between Supplier upload and Admin queue)
const INITIAL_BIDS = [
  {
    id: "GEM-BID-2026-001",
    bidderName: "Acme Tech Solutions Private Limited",
    gstin: "27AAPCS1234M1Z5",
    pan: "AAPCS1234M",
    udyam: "UDYAM-MH-12-0012345",
    submittedOn: "26 Aug 2026",
    status: "Verified",
    score: 95,
    risk: "LOW",
    compliance_record: "Excellent",
    taxpayer_type: "Regular",
    enterprise_type: "Micro",
    warnings: ["All parameters are highly compliant. No risks identified."],
    logs: [
      "[16:04:12] [System] Initiating cryptographic bid compliance inspection...",
      "[16:04:13] [SmartPDFHandler] Page 1: Digital text structure detected.",
      "[16:04:13] [RegexExtractor] Extracted GSTIN: 27AAPCS1234M1Z5",
      "[16:04:14] [RegexExtractor] Extracted Udyam ID: UDYAM-MH-12-0012345",
      "[16:04:14] [MockVerifier] Verifying GSTIN status: 'Active' (Owner: Acme Tech Solutions)",
      "[16:04:15] [MockVerifier] Verifying Udyam MSME status: 'Active' (Owner: Acme Tech Solutions)",
      "[16:04:15] [ScoringEngine] Full registry token alignment confirmed.",
      "[16:04:16] [ScoringEngine] Integrity verification completed. Compliance score: 95/100 (Risk: LOW)."
    ]
  },
  {
    id: "GEM-BID-2026-002",
    bidderName: "Global Traders Inc",
    gstin: "22AAAAA1111A1Z1",
    pan: "AAAAA1111A",
    udyam: "UDYAM-DL-01-0098765",
    submittedOn: "24 Aug 2026",
    status: "Under Review",
    score: 55,
    risk: "MEDIUM",
    compliance_record: "Poor",
    taxpayer_type: "Regular",
    enterprise_type: "Small",
    warnings: [
      "GSTIN status registered as 'Suspended' (-10 pts)",
      "GST compliance history marked as 'Poor' (-10 pts)",
      "Officer action recommended: Request GSTR-3B filing receipts for the last 3 consecutive months."
    ],
    logs: [
      "[11:15:30] [System] Initiating cryptographic bid compliance inspection...",
      "[11:15:32] [SmartPDFHandler] Page 1: Scanned image detected. Running OpenCV image filters...",
      "[11:15:33] [SmartPDFHandler] Preprocessing done. Running Tesseract OCR on page canvas...",
      "[11:15:34] [RegexExtractor] Extracted GSTIN: 22AAAAA1111A1Z1",
      "[11:15:35] [MockVerifier] WARNING: GSTIN registry status returned 'Suspended'!",
      "[11:15:35] [MockVerifier] WARNING: Compliance history returned 'Poor'!",
      "[11:15:36] [ScoringEngine] Penalty applied for suspended GSTIN status. Score: 55/100 (Risk: MEDIUM)."
    ]
  },
  {
    id: "GEM-BID-2026-003",
    bidderName: "Vanguard Systems Ltd",
    gstin: "27AAACV9876K1Z9",
    pan: "AAACV9876K",
    udyam: "",
    submittedOn: "20 Aug 2026",
    status: "Pending",
    score: 40,
    risk: "HIGH",
    compliance_record: "Good",
    taxpayer_type: "Regular",
    enterprise_type: "N/A",
    warnings: [
      "Mandatory PAN details mismatch (-10 pts)",
      "Udyam MSME certificate missing. MSME exemptions (EMD waiver) will not apply.",
      "CRITICAL: Registry mismatch between GSTIN name ('Vanguard Systems Ltd') and PAN owner ('Vanguard Director')."
    ],
    logs: [
      "[09:40:02] [System] Initiating cryptographic bid compliance inspection...",
      "[09:40:03] [SmartPDFHandler] Page 1: Digital text structure detected.",
      "[09:40:04] [RegexExtractor] Extracted GSTIN: 27AAACV9876K1Z9",
      "[09:40:04] [RegexExtractor] Extracted Standalone PAN: AAACV9876K",
      "[09:40:05] [MockVerifier] Comparing legal names across databases...",
      "[09:40:05] [MockVerifier] WARNING: Mismatch found: GSTIN Owner ('Vanguard Systems Ltd') vs PAN Owner ('Vanguard Director')",
      "[09:40:06] [ScoringEngine] Deducted 10 points for Registry name mismatch.",
      "[09:40:06] [ScoringEngine] Final Score: 40/100. Risk level: HIGH."
    ]
  }
];

function SectionPlaceholder({ title, description, rows }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="subtitle">{description}</p>
      <div className="section-panel">
        {rows.map((row) => (
          <div className="detail-item" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function Home({ role, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [bids, setBids] = useState(INITIAL_BIDS);
  const [selectedBid, setSelectedBid] = useState(null);
  const [officerNotes, setOfficerNotes] = useState("");

  const handleAddBid = (newBid) => {
    // Add dynamically to local database array
    setBids((prev) => [newBid, ...prev]);
  };

  const handleAuditAction = (bidId, newStatus) => {
    setBids((prevBids) =>
      prevBids.map((bid) => {
        if (bid.id === bidId) {
          const timestamp = new Date().toLocaleTimeString();
          const logEntry = `[${timestamp}] [Officer Action] Bid marked as '${newStatus}'. Notes: "${officerNotes || 'None'}"`;
          return {
            ...bid,
            status: newStatus,
            logs: [...bid.logs, logEntry]
          };
        }
        return bid;
      })
    );
    alert(`Success: Bid status updated to ${newStatus}`);
    setSelectedBid(null);
    setOfficerNotes("");
  };

  // 1. Supplier Navigation Items
  const supplierNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "documentUpload", label: "Verification Terminal", icon: CloudUpload },
    { id: "status", label: "Status Tracker", icon: Clock3 },
    { id: "profile", label: "My Profile", icon: UserCircle },
    { id: "support", label: "Help & Support", icon: LifeBuoy }
  ];

  // 2. Buyer (Officer) Navigation Items
  const buyerNav = [
    { id: "dashboard", label: "Master Audit Queue", icon: Sliders },
    { id: "profile", label: "Officer Profile", icon: UserCircle },
    { id: "support", label: "Compliance Helpdesk", icon: LifeBuoy }
  ];

  const navigationItems = role === "Buyer" ? buyerNav : supplierNav;

  // Supplier Dashboard Section
  const SupplierDashboard = () => {
    const verifiedCount = bids.filter((b) => b.status === "Verified").length;
    const reviewCount = bids.filter((b) => b.status === "Under Review").length;
    const pendingCount = bids.filter((b) => b.status === "Pending" || b.status === "Rejected").length;

    return (
      <>
        <h1>Welcome back, Shweta Beelwal</h1>
        <p className="subtitle">
          Submit compliance certificates and track verification milestones in real-time.
        </p>

        <div className="stats-grid">
          <div className="stat-card purple">
            <p>TOTAL BIDS FILED</p>
            <h2>{String(bids.length).padStart(2, "0")}</h2>
            <span className="stat-icon"><FileCheck2 size={20} /></span>
          </div>

          <div className="stat-card green">
            <p>VERIFIED PASSED</p>
            <h2>{String(verifiedCount).padStart(2, "0")}</h2>
            <span className="stat-icon"><CheckCircle2 size={20} /></span>
          </div>

          <div className="stat-card orange">
            <p>UNDER AUDIT</p>
            <h2>{String(reviewCount).padStart(2, "0")}</h2>
            <span className="stat-icon"><AlertTriangle size={20} /></span>
          </div>

          <div className="stat-card blue">
            <p>PENDING UPLOADS</p>
            <h2>{String(pendingCount).padStart(2, "0")}</h2>
            <span className="stat-icon"><Clock3 size={20} /></span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="applications-card">
            <div className="card-header">
              <h2>📁 Bid Documents Status Registry</h2>
              <button type="button" onClick={() => setActiveSection("status")}>Track Milestones</button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Bid ID</th>
                  <th>Submitted Document</th>
                  <th>Submitted On</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid.id} onClick={() => {
                    setSelectedBid(bid);
                  }}>
                    <td>{bid.id}</td>
                    <td>{bid.bidderName}</td>
                    <td>{bid.submittedOn}</td>
                    <td>
                      <span className={`risk-badge ${bid.risk.toLowerCase()}`}>
                        {bid.score} / {bid.risk}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${bid.status.toLowerCase().replace(" ", "")}`}>
                        {bid.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="right-column">
            <div className="application-status">
              <h2>Compliance Split</h2>
              <div className="circle" style={{
                background: `conic-gradient(#10b981 0deg 220deg, #f59e0b 220deg 290deg, #ef4444 290deg 360deg)`
              }}>
                <div>LOW RISK</div>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color"><span className="dot verified"></span>Low Risk</div>
                  <strong>{verifiedCount}</strong>
                </div>
                <div className="legend-item">
                  <div className="legend-color"><span className="dot review"></span>Medium Risk</div>
                  <strong>{reviewCount}</strong>
                </div>
                <div className="legend-item">
                  <div className="legend-color"><span className="dot rejected"></span>High Risk</div>
                  <strong>{pendingCount}</strong>
                </div>
              </div>
            </div>

            <div className="quick-actions" style={{ padding: '20px' }}>
              <h2 style={{ marginBottom: '14px' }}>Quick Actions</h2>
              <div className="quick-actions-list">
                <button type="button" className="action-btn" onClick={() => setActiveSection("documentUpload")}>
                  <span>Upload & Analyze Document</span>
                  <ArrowRight size={14} />
                </button>
                <button type="button" className="action-btn" onClick={() => setActiveSection("status")}>
                  <span>Check Audit History</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="help-section" style={{ marginTop: '30px' }}>
          <div>
            <h2><BookOpen size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> MSME Purchase Preference Benefit</h2>
            <p>
              Upload a valid MSME Udyam Certificate in the verification terminal to automatically trigger eligibility waivers.
            </p>
          </div>
          <button type="button" onClick={() => setActiveSection("support")}>MSME Guidelines</button>
        </div>
      </>
    );
  };

  // Buyer (Auditor / Admin) Dashboard Section
  const BuyerDashboard = () => {
    const totalBids = bids.length;
    const avgScore = Math.round(bids.reduce((sum, b) => sum + b.score, 0) / (totalBids || 1));
    const highRiskCount = bids.filter((b) => b.risk === "HIGH").length;
    const pendingAudits = bids.filter((b) => b.status === "Pending" || b.status === "Under Review").length;

    return (
      <>
        <h1>Compliance Inspection Command Center</h1>
        <p className="subtitle">
          Review, query, and sign off on bidder compliance documents submitted through the sovereign gateway.
        </p>

        <div className="stats-grid">
          <div className="stat-card purple">
            <p>TOTAL BIDS SUBMITTED</p>
            <h2>{String(totalBids).padStart(2, "0")}</h2>
            <span className="stat-icon"><FileCheck2 size={20} /></span>
          </div>

          <div className="stat-card green">
            <p>AVG COMPLIANCE SCORE</p>
            <h2>{avgScore}%</h2>
            <span className="stat-icon"><TrendingUp size={20} /></span>
          </div>

          <div className="stat-card orange">
            <p>HIGH RISK ALERTS</p>
            <h2>{String(highRiskCount).padStart(2, "0")}</h2>
            <span className="stat-icon"><AlertTriangle size={20} /></span>
          </div>

          <div className="stat-card blue">
            <p>PENDING AUDITS</p>
            <h2>{String(pendingAudits).padStart(2, "0")}</h2>
            <span className="stat-icon"><Sliders size={20} /></span>
          </div>
        </div>

        <div className="section-panel">
          <div className="card-header">
            <h2>🚨 Master Audit Verification Queue</h2>
            <small style={{ color: '#64748b', fontFamily: 'var(--mono)' }}>REAL-TIME REGISTRY STREAM</small>
          </div>

          <table>
            <thead>
              <tr>
                <th>Bid ID</th>
                <th>Bidder Organization</th>
                <th>Score</th>
                <th>Risk Classification</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>Inspection Action</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id} onClick={() => {
                  setSelectedBid(bid);
                  setOfficerNotes("");
                }}>
                  <td>{bid.id}</td>
                  <td><strong>{bid.bidderName}</strong></td>
                  <td><code style={{ fontSize: '0.85rem' }}>{bid.score}/100</code></td>
                  <td>
                    <span className={`risk-badge ${bid.risk.toLowerCase()}`}>{bid.risk}</span>
                  </td>
                  <td>{bid.submittedOn}</td>
                  <td>
                    <span className={`status-badge ${bid.status.toLowerCase().replace(" ", "")}`}>
                      {bid.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="action-btn" style={{ height: '30px', padding: '0 12px', fontSize: '0.75rem', width: 'auto' }}>
                      Inspect Bid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <SectionPlaceholder
            title={role === "Buyer" ? "Officer Profile" : "Supplier Profile"}
            description="Review details relating to your security clearances and portal role."
            rows={
              role === "Buyer"
                ? [
                    { label: "Officer Name", value: "Dr. Shashi Kumar (Auditor)" },
                    { label: "Clearance Authority", value: "GeM Audit Division" },
                    { label: "Clearance Level", value: "Level-3 Compliance Officer" },
                    { label: "Active Session ID", value: "SES-GEM-7890X" }
                  ]
                : [
                    { label: "Full Name", value: "Shweta Beelwal" },
                    { label: "Supplier Organization", value: "Acme Tech Solutions Private Limited" },
                    { label: "Verified GSTIN", value: "27AAPCS1234M1Z5" },
                    { label: "Verified PAN ID", value: "AAPCS1234M" }
                  ]
            }
          />
        );
      case "documentUpload":
        return <DocumentUploadPage onAddBid={handleAddBid} />;
      case "status":
        return <StatusPage bids={bids} onSelectBid={setSelectedBid} />;
      case "support":
        return (
          <SectionPlaceholder
            title="Sovereign Compliance Helpdesk"
            description="Contact the helpdesk for portal issues, compliance warnings, or regulatory guidance."
            rows={[
              { label: "Auditing Helpdesk", value: "compliance-support@gem.gov.in" },
              { label: "Emergency Hotline", value: "1800-425-8888 (Toll Free)" },
              { label: "Verification SLA", value: "Under 4 Hours" },
              { label: "Active Escalations", value: "0 tickets open" }
            ]}
          />
        );
      case "dashboard":
      default:
        return role === "Buyer" ? <BuyerDashboard /> : <SupplierDashboard />;
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-box">
            <Shield size={24} />
          </div>
          <div>
            <h2>GeM Procurement</h2>
            <p>Secure Portal</p>
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
              <Icon size={18} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="user-section">
          <div className="user-info">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div>
              <strong>{role === "Buyer" ? "Dr. Shashi Kumar" : "Shweta Beelwal"}</strong>
              <small>
                {role === "Buyer" ? "Auditor" : "Supplier"}
                <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
              </small>
            </div>
          </div>

          <button type="button" className="signout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <strong>Sovereign GeM Gateway</strong>
            <span>/</span>
            <span>{navigationItems.find((item) => item.id === activeSection)?.label || "Dashboard"}</span>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              <img src={profileImage} alt="Profile" />
            </div>
            <strong>{role === "Buyer" ? "Dr. Shashi Kumar" : "Shweta Beelwal"}</strong>
          </div>
        </header>

        <section className="content">{renderContent()}</section>
      </main>

      {/* ADMIN DETAIL DRILLDOWN INSPECTION DRAWER */}
      {selectedBid && (
        <div className="drawer-overlay" onClick={() => setSelectedBid(null)}>
          <div className="audit-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <h2>{selectedBid.bidderName}</h2>
                <span>Bid System ID: {selectedBid.id} | Submitted: {selectedBid.submittedOn}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedBid(null)}>✕</button>
            </div>

            <div className="drawer-content">
              {/* Score section inside drawer */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                  <svg className="dial-svg" viewBox="0 0 100 100">
                    <circle className="dial-track" cx="50" cy="50" r="40" strokeWidth="8" />
                    <circle 
                      className="dial-value" 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      strokeWidth="8"
                      strokeDasharray={`${(selectedBid.score / 100) * 251.2} 251.2`}
                      stroke={selectedBid.score >= 85 ? '#10b981' : selectedBid.score >= 50 ? '#f59e0b' : '#ef4444'}
                    />
                  </svg>
                  <div className="dial-text">
                    <span className="dial-score" style={{ fontSize: '1.25rem' }}>{selectedBid.score}</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Compliance Score & Risk</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'left', marginBottom: '8px' }}>
                    Weighted registry status and name matching analysis.
                  </p>
                  <span className={`risk-badge ${selectedBid.risk.toLowerCase()}`}>
                    {selectedBid.risk} Risk Rating
                  </span>
                  <span className={`status-badge ${selectedBid.status.toLowerCase().replace(" ", "")}`} style={{ marginLeft: '10px' }}>
                    {selectedBid.status}
                  </span>
                </div>
              </div>

              {/* Cross Registry Verification Details */}
              <div className="cross-verification-box">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  Registry Cross-Verification Records
                </h4>
                <table className="cross-table">
                  <thead>
                    <tr>
                      <th>Registry</th>
                      <th>Identifier</th>
                      <th>Registrant Name</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>GSTIN</strong></td>
                      <td>{selectedBid.gstin || <em style={{ color: '#ef4444' }}>Missing</em>}</td>
                      <td>{selectedBid.bidderName}</td>
                      <td>
                        {selectedBid.gstin ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Active ✓</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Not Provided ✕</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>PAN</strong></td>
                      <td>{selectedBid.pan || <em style={{ color: '#ef4444' }}>Missing</em>}</td>
                      <td>{selectedBid.bidderName}</td>
                      <td>
                        {selectedBid.pan ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Active ✓</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>Not Provided ✕</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Udyam MSME</strong></td>
                      <td>{selectedBid.udyam || <em>Not Provided</em>}</td>
                      <td>{selectedBid.udyam ? selectedBid.bidderName : "N/A"}</td>
                      <td>
                        {selectedBid.udyam ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Verified ✓</span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Exempt / Missing</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Warnings List */}
              {selectedBid.warnings && selectedBid.warnings.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Integrity Assessment & Deductions</h4>
                  <div className="warnings-list">
                    {selectedBid.warnings.map((w, idx) => (
                      <div key={idx} className={`warning-item ${selectedBid.risk === "HIGH" ? "critical" : selectedBid.risk === "MEDIUM" ? "warning" : "info"}`}>
                        <div className="warning-icon">⚠</div>
                        <div className="warning-text">{w}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cryptographic Execution Logs */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Audit Execution Console Trace</h4>
                <div className="terminal-window" style={{ marginTop: '0' }}>
                  <div className="terminal-body" style={{ height: '180px' }}>
                    {selectedBid.logs.map((log, idx) => {
                      let typeClass = "info";
                      if (log.includes("WARNING") || log.includes("Penalty")) typeClass = "warning";
                      if (log.includes("CRITICAL") || log.includes("mismatch")) typeClass = "danger";
                      if (log.includes("completed") || log.includes("Verified") || log.includes("confirmed")) typeClass = "success";
                      return (
                        <div key={idx} className={`term-line ${typeClass}`}>
                          {log}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {role === "Buyer" && (
                <div className="audit-action-sheet">
                  <label>Auditor Sign-Off & Review Notes</label>
                  <textarea 
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter audit validation comments, details regarding requested revision documents, or justification notes..."
                  />
                </div>
              )}
            </div>

            {role === "Buyer" && (
              <div className="drawer-actions">
                <button type="button" className="approve-btn" onClick={() => handleAuditAction(selectedBid.id, "Verified")}>
                  Approve Bid Compliance
                </button>
                <button type="button" className="reject-btn" onClick={() => handleAuditAction(selectedBid.id, "Rejected")}>
                  Reject Bid / Request Revision
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;