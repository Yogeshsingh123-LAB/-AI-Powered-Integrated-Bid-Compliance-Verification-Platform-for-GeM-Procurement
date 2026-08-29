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
  BookOpen,
  Search,
  ChevronDown,
  FolderOpen,
  ClipboardList,
  FileText
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

const INITIAL_BIDDERS_LIST = [
  { id: 1, name: "ABC Engineering Pvt. Ltd.", tender: "GEM-CPCL-001", documents: "10/10", compliance: 92, risk: "Low", verification: "Verified" },
  { id: 2, name: "XYZ Industries Pvt. Ltd.", tender: "GEM-CPCL-001", documents: "9/10", compliance: 78, risk: "Medium", verification: "Review Required" },
  { id: 3, name: "PQR Pumps Ltd.", tender: "GEM-CPCL-001", documents: "7/10", compliance: 61, risk: "High", verification: "Issues" },
  { id: 4, name: "Acme Tech Solutions Private Limited", tender: "GEM-CPCL-002", documents: "10/10", compliance: 95, risk: "Low", verification: "Verified" },
  { id: 5, name: "Global Traders Inc", tender: "GEM-CPCL-002", documents: "8/10", compliance: 55, risk: "Medium", verification: "Review Required" },
  { id: 6, name: "Vanguard Systems Ltd", tender: "GEM-CPCL-002", documents: "7/10", compliance: 40, risk: "High", verification: "Issues" }
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

function Home({ role, user, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [bids, setBids] = useState(INITIAL_BIDS);
  const [selectedBid, setSelectedBid] = useState(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleAddBid = (newBid) => {
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
    { id: "myBids", label: "My Bids", icon: FileCheck2 },
    { id: "documents", label: "Documents", icon: CloudUpload },
    { id: "tenders", label: "Tenders", icon: FolderOpen },
    { id: "notifications", label: "Notifications", icon: Bell }
  ];

  // 2. Buyer (Officer) Navigation Items
  const buyerNav = [
    { id: "dashboard", label: "Dashboard" },
    { id: "tenders", label: "Tenders" },
    { id: "bidders", label: "Bidders" },
    { id: "verification", label: "Verification" },
    { id: "reports", label: "Reports" },
    { id: "auditTrail", label: "Audit Trail" }
  ];

  const navigationItems = role === "Buyer" ? buyerNav : supplierNav;

  // New Bidder (Supplier) Dashboard View Component
  const BidderDashboardView = () => {
    return (
      <div className="bidder-dashboard-content">
        {/* Welcome Section */}
        <div className="bidder-hero-banner">
          <div className="hero-left-content">
            <span className="hero-eyebrow">BIDDER PORTAL</span>
            <h1>Good Morning, {user ? user.full_name : "ABC Engineering Pvt. Ltd."}</h1>
            <p className="hero-subtitle">
              Automated AI compliance verification active across GSTIN, PAN, Udyam MSME, and OEM credentials.
            </p>
            <div className="hero-action-pills">
              <button className="hero-pill-btn active" onClick={() => setActiveSection("tenders")}>
                + Explore New Tenders
              </button>
              <button className="hero-pill-btn" onClick={() => setActiveSection("documents")}>
                Upload Documents
              </button>
            </div>
          </div>
        </div>

        {/* Vibrant Summary Metric Cards */}
        <div className="summary-cards-row">
          <div className="summary-card card-blue-glow" onClick={() => setActiveSection("tenders")} style={{ cursor: "pointer" }}>
            <div className="card-top">
              <span className="card-label">Active Tenders</span>
              <div className="card-icon-wrapper blue">
                <FolderOpen size={20} />
              </div>
            </div>
            <h2 className="card-value">05</h2>
            <span className="card-subtext warning">⚡ 2 closing within 48h</span>
          </div>

          <div className="summary-card card-emerald-glow" onClick={() => setActiveSection("myBids")} style={{ cursor: "pointer" }}>
            <div className="card-top">
              <span className="card-label">My Bids</span>
              <div className="card-icon-wrapper emerald">
                <FileCheck2 size={20} />
              </div>
            </div>
            <h2 className="card-value">08</h2>
            <span className="card-subtext info">✓ 3 under verification</span>
          </div>

          <div className="summary-card card-amber-glow" onClick={() => setActiveSection("myBids")} style={{ cursor: "pointer" }}>
            <div className="card-top">
              <span className="card-label">Draft Bids</span>
              <div className="card-icon-wrapper amber">
                <FileText size={20} />
              </div>
            </div>
            <h2 className="card-value">02</h2>
            <span className="card-subtext warning">⏳ Ready for final review</span>
          </div>

          <div className="summary-card card-purple-glow" onClick={() => setActiveSection("documents")} style={{ cursor: "pointer" }}>
            <div className="card-top">
              <span className="card-label">Documents</span>
              <div className="card-icon-wrapper purple">
                <ClipboardList size={20} />
              </div>
            </div>
            <h2 className="card-value">42</h2>
            <span className="card-subtext success">🛡️ 38 verified</span>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="dashboard-main-split">
          {/* Left Column - Active Bids */}
          <div className="split-left-col">
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>Active Bids Registry</h2>
              <button className="text-link-btn" onClick={() => setActiveSection("myBids")}>View All Bids →</button>
            </div>

            <div className="bids-list">
              {/* Card 1 */}
              <div className="bid-item-card accent-left-amber" onClick={() => setSelectedBid(bids[0] || INITIAL_BIDS[0])} style={{ cursor: "pointer" }}>
                <div className="bid-card-header">
                  <div>
                    <span className="bid-id">GEM-CPCL-2026-001</span>
                    <h3>Supply of Industrial Pumps</h3>
                    <span className="bid-org">Chennai Petroleum Corporation Limited</span>
                  </div>
                  <span className="bid-status-tag draft">Draft (80%)</span>
                </div>

                <div className="bid-card-body">
                  <div className="deadline-row">
                    <span>Submission Deadline:</span>
                    <strong>30 Sep 2026 (14 days remaining)</strong>
                  </div>

                  <div className="progress-section">
                    <div className="progress-info">
                      <span>Document Completeness</span>
                      <strong>8 / 10 Documents</strong>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill amber" style={{ width: "80%" }}></div>
                    </div>
                    <span className="progress-percentage amber">80%</span>
                  </div>
                </div>

                <div className="bid-card-footer">
                  <div className="bid-actions">
                    <button className="primary-action-btn vibrant-blue" onClick={(e) => { e.stopPropagation(); setActiveSection("documents"); }}>
                      Continue Bid Submission
                    </button>
                    <button className="secondary-action-btn" onClick={(e) => { e.stopPropagation(); setSelectedBid(bids[0] || INITIAL_BIDS[0]); }}>
                      View Details
                    </button>
                  </div>
                  <div className="bid-warning-msg">
                    <AlertTriangle size={14} className="warning-icon" />
                    <span>2 mandatory documents required</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bid-item-card accent-left-emerald" onClick={() => setSelectedBid(bids[1] || INITIAL_BIDS[1])} style={{ cursor: "pointer" }}>
                <div className="bid-card-header">
                  <div>
                    <span className="bid-id">GEM-CPCL-2026-002</span>
                    <h3>Industrial Equipment Maintenance Services</h3>
                    <span className="bid-org">Chennai Petroleum Corporation Limited</span>
                  </div>
                  <span className="bid-status-tag ready">Ready to Submit</span>
                </div>

                <div className="bid-card-body">
                  <div className="deadline-row">
                    <span>Submission Deadline:</span>
                    <strong>15 Oct 2026 (29 days remaining)</strong>
                  </div>

                  <div className="progress-section">
                    <div className="progress-info">
                      <span>Document Completeness</span>
                      <strong>10 / 10 Documents</strong>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill success" style={{ width: "100%" }}></div>
                    </div>
                    <span className="progress-percentage success">100%</span>
                  </div>
                </div>

                <div className="bid-card-footer">
                  <div className="bid-actions">
                    <button className="submit-action-btn vibrant-emerald" onClick={(e) => { e.stopPropagation(); handleSubmitBid("GEM-CPCL-2026-002"); }}>
                      Review & Submit Bid
                    </button>
                    <button className="secondary-action-btn" onClick={(e) => { e.stopPropagation(); setSelectedBid(bids[1] || INITIAL_BIDS[1]); }} style={{ marginLeft: "10px" }}>
                      View Details
                    </button>
                  </div>
                  <div className="bid-verified-msg">
                    <CheckCircle2 size={14} className="success-icon" style={{ color: "#10b981" }} />
                    <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.8rem" }}>AI Verification Passed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Assistant & Recent Activity */}
          <div className="split-right-col">
            {/* AI Submission Assistant */}
            <div className="ai-assistant-card studio-gradient">
              <div className="ai-card-header">
                <h3>AI Submission Assistant <span className="sparkle-icon">✨</span></h3>
              </div>
              <p className="ai-message">"Your bid for GEM-CPCL-2026-001 is 80% complete. Clear 2 document flags to guarantee auto-approval."</p>
              <ul className="ai-checks-list">
                <li className="check-item checked">
                  <CheckCircle2 size={16} className="status-icon success" />
                  <span>GSTIN & PAN Registry Verified</span>
                </li>
                <li className="check-item checked">
                  <CheckCircle2 size={16} className="status-icon success" />
                  <span>MSME Exemption Certificate Valid</span>
                </li>
                <li className="check-item warn">
                  <AlertTriangle size={16} className="status-icon warning" />
                  <span>2 Financial Statements Pending</span>
                </li>
              </ul>
              <button className="assistant-action-btn" onClick={() => setActiveSection("documents")}>
                Upload Pending Docs
              </button>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-card light-panel-box">
              <div className="activity-card-header">
                <h3>Recent Activity</h3>
              </div>
              <ul className="activity-list">
                <li className="activity-item">
                  <div className="activity-dot success"></div>
                  <div className="activity-info">
                    <p>GST Certificate uploaded & verified</p>
                    <span>Today, 10:32 AM</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot success"></div>
                  <div className="activity-info">
                    <p>PAN Certificate matched with CBDT</p>
                    <span>Today, 10:35 AM</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot warning"></div>
                  <div className="activity-info">
                    <p>Income Tax document review flag added</p>
                    <span>Today, 10:38 AM</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot info"></div>
                  <div className="activity-info">
                    <p>Bid draft GEM-CPCL-2026-001 saved</p>
                    <span>Today, 10:40 AM</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MyBidsSection = () => {
    const [myBidsFilter, setMyBidsFilter] = useState("all");

    const filteredBids = bids.filter((bid) => {
      if (myBidsFilter === "verification") {
        return (
          bid.status.toLowerCase().includes("under") ||
          bid.status.toLowerCase().includes("pending") ||
          bid.status.toLowerCase().includes("review") ||
          bid.status.toLowerCase().includes("draft")
        );
      }
      if (myBidsFilter === "completed") {
        return (
          bid.status.toLowerCase().includes("verified") ||
          bid.status.toLowerCase().includes("completed") ||
          bid.status.toLowerCase().includes("submitted") ||
          bid.status.toLowerCase().includes("approved")
        );
      }
      return true;
    });

    return (
      <div className="bidder-section-wrapper">
        {/* Unique Teal Hero Banner for My Bids */}
        <div className="section-hero-banner teal-theme">
          <div>
            <span className="hero-eyebrow">SUBMISSION REGISTRY</span>
            <h2>My Filed & Draft Bids</h2>
            <p className="hero-subtext">Real-time auditing, compliance score breakdown, and verification audit trail.</p>
          </div>
          <div className="hero-stat-pill">
            <span>TOTAL BIDS</span>
            <strong>{bids.length} Active</strong>
          </div>
        </div>

        <div className="section-panel studio-panel">
          <div className="panel-table-header">
            <h3>Registered Bid Records</h3>
            <div className="panel-actions">
              <span 
                className={`filter-pill ${myBidsFilter === "all" ? "active" : ""}`}
                onClick={() => setMyBidsFilter("all")}
              >
                All Bids
              </span>
              <span 
                className={`filter-pill ${myBidsFilter === "verification" ? "active" : ""}`}
                onClick={() => setMyBidsFilter("verification")}
              >
                Under Verification
              </span>
              <span 
                className={`filter-pill ${myBidsFilter === "completed" ? "active" : ""}`}
                onClick={() => setMyBidsFilter("completed")}
              >
                Completed
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="studio-table">
              <thead>
                <tr>
                  <th>Bid ID</th>
                  <th>Bidder Organization</th>
                  <th>Submitted On</th>
                  <th>Compliance Rating</th>
                  <th>Audit Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.map((bid) => (
                  <tr key={bid.id} onClick={() => setSelectedBid(bid)} className="clickable-row">
                    <td><strong className="id-badge">{bid.id}</strong></td>
                    <td><span className="org-title">{bid.bidderName}</span></td>
                    <td><span className="date-text">{bid.submittedOn}</span></td>
                    <td>
                      <span className={`risk-badge ${bid.risk.toLowerCase()}`}>
                        {bid.score}% — {bid.risk} RISK
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${bid.status.toLowerCase().replace(" ", "")}`}>
                        ● {bid.status}
                      </span>
                    </td>
                    <td>
                      <button className="table-inspect-btn" onClick={(e) => { e.stopPropagation(); setSelectedBid(bid); }}>
                        Inspect Audit →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const TendersSection = () => {
    const mockTenders = [
      { id: "GEM/2026/B/876543", title: "Supply and Installation of Server Racks", department: "NIC Delhi", value: "₹45,00,000", deadline: "12 Sep 2026", category: "Hardware" },
      { id: "GEM/2026/B/876544", title: "Supply of Industrial Pumps", department: "CPCL Chennai", value: "₹1,20,00,000", deadline: "30 Sep 2026", category: "Industrial" },
      { id: "GEM/2026/B/876545", title: "Industrial Equipment Maintenance Services", department: "CPCL Chennai", value: "₹85,00,000", deadline: "15 Oct 2026", category: "Services" },
      { id: "GEM/2026/B/876546", title: "Office Automation and Computing Systems", department: "Ministry of Finance", value: "₹38,00,000", deadline: "22 Oct 2026", category: "IT Goods" }
    ];

    return (
      <div className="bidder-section-wrapper">
        {/* Unique Emerald Hero Banner for GeM Tenders */}
        <div className="section-hero-banner emerald-theme">
          <div>
            <span className="hero-eyebrow">OPPORTUNITY EXPLORER</span>
            <h2>Available GeM Tenders</h2>
            <p className="hero-subtext">Browse matching government procurements and launch instant compliance pre-audits.</p>
          </div>
        </div>

        <div className="section-panel studio-panel">
          <div className="panel-table-header">
            <h3>Live Procurement Opportunities</h3>
            <div className="search-pill-box">
              <input type="text" placeholder="Search tenders by keyword, Ministry, or ID..." className="studio-search-input" />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="studio-table">
              <thead>
                <tr>
                  <th>Tender Reference</th>
                  <th>Description</th>
                  <th>Department</th>
                  <th>Estimated Value</th>
                  <th>Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockTenders.map((tender) => (
                  <tr key={tender.id}>
                    <td><strong className="id-badge emerald">{tender.id}</strong></td>
                    <td>
                      <div className="tender-desc-cell">
                        <strong>{tender.title}</strong>
                        <span className="cat-tag">{tender.category}</span>
                      </div>
                    </td>
                    <td>{tender.department}</td>
                    <td><strong className="value-highlight">{tender.value}</strong></td>
                    <td><span className="deadline-badge">{tender.deadline}</span></td>
                    <td>
                      <button
                        className="table-action-btn emerald"
                        onClick={() => setActiveSection("documents")}
                      >
                        Create Bid →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const NotificationsSection = () => {
    const mockNotifications = [
      { id: 1, title: "GSTIN Validation Complete", text: "GSTIN registration successfully validated against GSTN portal for Acme Tech Solutions.", type: "success", time: "1 hour ago" },
      { id: 2, title: "PAN Name Mismatch Warning", text: "PAN Verification returned warning: Name mismatch found on Vanguard Systems records.", type: "warning", time: "2 hours ago" },
      { id: 3, title: "Income Tax Audit Flagged", text: "Verification System Notice: Income Tax document requires procurement officer review.", type: "info", time: "Today, 10:38 AM" },
      { id: 4, title: "MSME Policy Directive Update", text: "Central Ministry updated MSME purchase preference benefit policies for Class-1 local suppliers.", type: "info", time: "Yesterday" }
    ];

    return (
      <div className="bidder-section-wrapper">
        {/* Unique Amber/Indigo Hero Banner for Notifications */}
        <div className="section-hero-banner indigo-theme">
          <div>
            <span className="hero-eyebrow">AUDIT DISPATCHES</span>
            <h2>Notifications & Audit Stream</h2>
            <p className="hero-subtext">Automated warnings, cross-verification alerts, and system compliance logs.</p>
          </div>
        </div>

        <div className="section-panel studio-panel">
          <div className="notifications-stream">
            {mockNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`stream-item ${notif.type}`}
              >
                <div className="stream-badge-col">
                  <span className={`stream-type-pill ${notif.type}`}>{notif.type.toUpperCase()}</span>
                </div>
                <div className="stream-content-col">
                  <h4>{notif.title}</h4>
                  <p>{notif.text}</p>
                </div>
                <div className="stream-time-col">
                  <span>{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Buyer (Officer) views for tabs
  const BuyerDashboardView = () => {
    return (
      <div className="officer-dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-banner">
          <h1>Good Morning, Procurement Officer 👋</h1>
          <p className="subtitle">Monitor tender activity, bidder compliance and verification progress.</p>
        </div>

        {/* KPI Cards */}
        <div className="summary-cards-row">
          <div className="summary-card">
            <div className="card-top">
              <span className="card-label">Active Tenders</span>
              <FolderOpen size={20} className="card-icon blue" />
            </div>
            <h2 className="card-value">12</h2>
            <span className="card-subtext success">+3 this month</span>
          </div>
          <div className="summary-card">
            <div className="card-top">
              <span className="card-label">Total Bids</span>
              <FileCheck2 size={20} className="card-icon purple" />
            </div>
            <h2 className="card-value">148</h2>
            <span className="card-subtext success">+18 this week</span>
          </div>
          <div className="summary-card">
            <div className="card-top">
              <span className="card-label">Pending Verification</span>
              <Clock3 size={20} className="card-icon orange" />
            </div>
            <h2 className="card-value">27</h2>
            <span className="card-subtext warning">Needs attention</span>
          </div>
          <div className="summary-card">
            <div className="card-top">
              <span className="card-label">High Risk Bidders</span>
              <AlertTriangle size={20} className="card-icon red" />
            </div>
            <h2 className="card-value">08</h2>
            <span className="card-subtext danger">Requires review</span>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="dashboard-main-split">
          {/* Left Column - Tender Overview */}
          <div className="split-left-col">
            <div className="section-header">
              <h2>Tender Overview</h2>
            </div>

            <div className="section-panel" style={{ padding: "0", overflow: "hidden" }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Tender ID</th>
                    <th>Tender Name</th>
                    <th>Bids</th>
                    <th>Verified</th>
                    <th>Pending</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>GEM-CPCL-001</strong></td>
                    <td>Industrial Pumps</td>
                    <td>24</td>
                    <td>18</td>
                    <td>6</td>
                    <td><span className="status-badge pending">Open</span></td>
                  </tr>
                  <tr>
                    <td><strong>GEM-CPCL-002</strong></td>
                    <td>Maintenance Services</td>
                    <td>31</td>
                    <td>27</td>
                    <td>4</td>
                    <td><span className="status-badge review">Verification</span></td>
                  </tr>
                  <tr>
                    <td><strong>GEM-CPCL-003</strong></td>
                    <td>Safety Equipment</td>
                    <td>18</td>
                    <td>18</td>
                    <td>0</td>
                    <td><span className="status-badge verified">Completed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - AI Insights & Recent Activity */}
          <div className="split-right-col">
            {/* AI Verification Insights */}
            <div className="ai-assistant-card">
              <div className="ai-card-header">
                <h3>AI Verification Insights <span className="sparkle-icon">✨</span></h3>
              </div>
              <ul className="ai-checks-list" style={{ marginTop: "16px" }}>
                <li className="check-item checked">
                  <CheckCircle2 size={16} className="status-icon success" style={{ color: "#10b981" }} />
                  <span>86% bids automatically verified</span>
                </li>
                <li className="check-item warn">
                  <AlertTriangle size={16} className="status-icon warning" style={{ color: "#f59e0b" }} />
                  <span>12 inconsistencies detected</span>
                </li>
                <li className="check-item err">
                  <XCircle size={16} className="status-icon danger" style={{ color: "#f43f5e" }} />
                  <span>7 high-risk cases require manual review</span>
                </li>
                <li className="check-item checked">
                  <CheckCircle2 size={16} className="status-icon success" style={{ color: "#10b981" }} />
                  <span>91% document validation confidence</span>
                </li>
              </ul>
              <button className="assistant-action-btn" onClick={() => setActiveSection("reports")}>
                View Insights
              </button>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-card">
              <div className="activity-card-header">
                <h3>Recent Activity</h3>
              </div>
              <ul className="activity-list">
                <li className="activity-item">
                  <div className="activity-dot success"></div>
                  <div className="activity-info">
                    <p>Bid submitted by ABC Engineering</p>
                    <span>Just now</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot success"></div>
                  <div className="activity-info">
                    <p>GST verification completed</p>
                    <span>10 mins ago</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot warning"></div>
                  <div className="activity-info">
                    <p>OEM authorization requires review</p>
                    <span>25 mins ago</span>
                  </div>
                </li>
                <li className="activity-item">
                  <div className="activity-dot info"></div>
                  <div className="activity-info">
                    <p>New tender published</p>
                    <span>1 hour ago</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TendersView = () => {
    return (
      <div className="section-panel" style={{ padding: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2>Tenders Management</h2>
            <p className="subtitle">
              Create and manage all active procurement tenders and their configuration policies.
            </p>
          </div>
          <button
            className="primary-action-btn"
            onClick={() => setActiveSection("createTender")}
            style={{ height: "42px", padding: "0 20px", borderRadius: "10px" }}
          >
            + Create Tender
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tender Reference</th>
              <th>Description</th>
              <th>Department</th>
              <th>Estimated Value</th>
              <th>Submission Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>GEM-CPCL-001</strong></td>
              <td>Industrial Pumps Procurement</td>
              <td>CPCL Chennai</td>
              <td>₹1,20,00,000</td>
              <td>30 Sep 2026</td>
              <td><span className="status-badge pending">Open</span></td>
            </tr>
            <tr>
              <td><strong>GEM-CPCL-002</strong></td>
              <td>Industrial Equipment Maintenance Services</td>
              <td>CPCL Chennai</td>
              <td>₹85,00,000</td>
              <td>15 Oct 2026</td>
              <td><span className="status-badge review">Verification</span></td>
            </tr>
            <tr>
              <td><strong>GEM-CPCL-003</strong></td>
              <td>Safety Equipment and PPE Kits</td>
              <td>CPCL Chennai</td>
              <td>₹45,00,000</td>
              <td>10 Aug 2026</td>
              <td><span className="status-badge verified">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Modern premium Bidder list view component
  const BiddersView = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [tenderFilter, setTenderFilter] = useState("All");
    const [complianceFilter, setComplianceFilter] = useState("All");
    const [riskFilter, setRiskFilter] = useState("All");
    const [verificationFilter, setVerificationFilter] = useState("All");
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

    // Filter Logic
    const filteredBidders = INITIAL_BIDDERS_LIST.filter(b => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(query) || 
                            b.tender.toLowerCase().includes(query);
      
      const matchesTender = tenderFilter === "All" || b.tender === tenderFilter;

      let matchesCompliance = true;
      if (complianceFilter === "High") matchesCompliance = b.compliance >= 90;
      else if (complianceFilter === "Medium") matchesCompliance = b.compliance >= 70 && b.compliance < 90;
      else if (complianceFilter === "Low") matchesCompliance = b.compliance < 70;

      const matchesRisk = riskFilter === "All" || b.risk.toLowerCase() === riskFilter.toLowerCase();
      const matchesVerification = verificationFilter === "All" || b.verification.toLowerCase() === verificationFilter.toLowerCase();

      return matchesSearch && matchesTender && matchesCompliance && matchesRisk && matchesVerification;
    });

    const handleExportCSV = () => {
      const headers = ["Bidder", "Tender", "Documents", "Compliance", "Risk", "Verification"];
      const rows = filteredBidders.map(b => [
        `"${b.name}"`,
        `"${b.tender}"`,
        `"${b.documents}"`,
        `"${b.compliance}%"`,
        `"${b.risk}"`,
        `"${b.verification}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Bidder_Applications_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportDropdownOpen(false);
    };

    const handleExportPDF = () => {
      const printWindow = window.open("", "_blank");
      const html = `
        <html>
          <head>
            <title>Bidder Applications Registry Report</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #0f172a; }
              h1 { margin-bottom: 5px; font-size: 1.8rem; }
              p.meta { color: #64748b; margin-top: 0; margin-bottom: 30px; font-size: 0.9rem; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; padding: 12px; font-size: 0.75rem; text-transform: uppercase; color: #64748b; }
              td { border-bottom: 1px solid #e2e8f0; padding: 14px 12px; font-size: 0.85rem; color: #334155; }
              .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; display: inline-block; }
              .badge.verified { background: #dcfce7; color: #15803d; }
              .badge.reviewrequired { background: #fef9c3; color: #a16207; }
              .badge.issues { background: #fee2e2; color: #b91c1c; }
            </style>
          </head>
          <body>
            <h1>Bidder Applications Registry Report</h1>
            <p class="meta">Generated on ${new Date().toLocaleString()} | Filtered Records: ${filteredBidders.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Bidder</th>
                  <th>Tender</th>
                  <th>Documents</th>
                  <th>Compliance</th>
                  <th>Risk</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                ${filteredBidders.map(b => `
                  <tr>
                    <td><strong>${b.name}</strong></td>
                    <td>${b.tender}</td>
                    <td>${b.documents}</td>
                    <td>${b.compliance}%</td>
                    <td>${b.risk}</td>
                    <td><span class="badge ${b.verification.toLowerCase().replace(/\s+/g, "")}">${b.verification}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      setExportDropdownOpen(false);
    };

    return (
      <div className="bidders-dashboard-content">
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Bidder Applications</h1>
            <p className="subtitle" style={{ margin: 0 }}>Review and monitor bidder participation across active tenders.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", position: "relative" }}>
            <button 
              className="secondary-action-btn" 
              style={{ height: "40px", padding: "0 16px", display: "flex", alignItems: "center", gap: "8px" }} 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            >
              Export Report <ChevronDown size={14} />
            </button>
            {exportDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "45px",
                right: "120px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                zIndex: 10,
                width: "150px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}>
                <button 
                  style={{ background: "none", border: "none", padding: "10px 16px", textAlign: "left", fontSize: "0.85rem", cursor: "pointer", color: "#334155" }}
                  onClick={handleExportCSV}
                >
                  Export as CSV
                </button>
                <button 
                  style={{ background: "none", border: "none", padding: "10px 16px", textAlign: "left", fontSize: "0.85rem", cursor: "pointer", color: "#334155", borderTop: "1px solid #f1f5f9" }}
                  onClick={handleExportPDF}
                >
                  Print / Save PDF
                </button>
              </div>
            )}
            <button className="primary-action-btn" style={{ height: "40px", padding: "0 16px" }} onClick={() => {
              setSearchQuery("");
              setTenderFilter("All");
              setComplianceFilter("All");
              setRiskFilter("All");
              setVerificationFilter("All");
            }}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Search and Filters row */}
        <div className="search-filters-bar" style={{ display: "flex", gap: "16px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", alignItems: "center" }}>
          <div className="search-wrapper" style={{ position: "relative", flexGrow: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search bidder, Tender ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", height: "42px", padding: "0 16px 0 42px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
            />
          </div>
          <div className="filter-selects" style={{ display: "flex", gap: "12px" }}>
            <select 
              value={tenderFilter}
              onChange={(e) => setTenderFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.85rem", color: "#334155" }}
            >
              <option value="All">All Tenders</option>
              <option value="GEM-CPCL-001">GEM-CPCL-001</option>
              <option value="GEM-CPCL-002">GEM-CPCL-002</option>
            </select>
            <select 
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.85rem", color: "#334155" }}
            >
              <option value="All">Compliance Status</option>
              <option value="High">High Compliance (≥90%)</option>
              <option value="Medium">Medium Compliance (70-89%)</option>
              <option value="Low">Low Compliance (&lt;70%)</option>
            </select>
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.85rem", color: "#334155" }}
            >
              <option value="All">Risk Level</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
            <select 
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              style={{ height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.85rem", color: "#334155" }}
            >
              <option value="All">Verification Status</option>
              <option value="Verified">Verified</option>
              <option value="Review Required">Review Required</option>
              <option value="Issues">Issues</option>
            </select>
          </div>
        </div>

        {/* Bidder Table */}
        <div className="section-panel" style={{ padding: "0", overflow: "hidden", marginBottom: "24px" }}>
          <table style={{ margin: "0" }}>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Tender</th>
                <th>Documents</th>
                <th>Compliance</th>
                <th>Risk</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBidders.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.tender}</td>
                  <td>{b.documents}</td>
                  <td>
                    <strong style={{ color: b.compliance >= 90 ? "#10b981" : b.compliance >= 70 ? "#f59e0b" : "#ef4444" }}>
                      {b.compliance}%
                    </strong>
                  </td>
                  <td>
                    <span className={`risk-badge ${b.risk.toLowerCase()}`}>
                      {b.risk}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${b.verification.toLowerCase().replace(/\s+/g, "")}`}>
                      {b.verification}
                    </span>
                  </td>
                  <td>
                    {b.verification === "Verified" ? (
                      <button className="action-btn" style={{ height: "30px", padding: "0 12px", fontSize: "0.75rem", width: "auto" }} onClick={() => {
                        setActiveSection("verification");
                      }}>
                        View
                      </button>
                    ) : b.verification === "Review Required" ? (
                      <button className="action-btn" style={{ height: "30px", padding: "0 12px", fontSize: "0.75rem", width: "auto" }} onClick={() => {
                        setActiveSection("verification");
                      }}>
                        Review
                      </button>
                    ) : (
                      <button className="reject-btn" style={{ height: "30px", padding: "0 12px", fontSize: "0.75rem", width: "auto", borderRadius: "8px", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }} onClick={() => {
                        setActiveSection("verification");
                      }}>
                        Investigate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBidders.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    No bidders found matching active search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Statistics Cards */}
        <div className="summary-cards-row">
          <div className="summary-card">
            <span className="card-label">Total Bidders</span>
            <h2 className="card-value" style={{ marginTop: "10px" }}>{filteredBidders.length}</h2>
          </div>
          <div className="summary-card">
            <span className="card-label" style={{ color: "#10b981" }}>Verified</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#10b981" }}>
              {filteredBidders.filter(b => b.verification === "Verified").length}
            </h2>
          </div>
          <div className="summary-card">
            <span className="card-label" style={{ color: "#f59e0b" }}>Under Review</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#f59e0b" }}>
              {filteredBidders.filter(b => b.verification === "Review Required").length}
            </h2>
          </div>
          <div className="summary-card">
            <span className="card-label" style={{ color: "#ef4444" }}>High Risk</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#ef4444" }}>
              {filteredBidders.filter(b => b.risk === "High").length}
            </h2>
          </div>
        </div>
      </div>
    );
  };

  // Advanced AI Bid Verification Dashboard View component
  const VerificationView = () => {
    const [verificationStep, setVerificationStep] = useState("matrix");
    const [decisionRemarks, setDecisionRemarks] = useState("");
    const [reviewedCheckbox, setReviewedCheckbox] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState(""); // qualify, clarification, disqualify

    if (verificationStep === "decision") {
      return (
        <div className="verification-dashboard-content">
          {/* Bid Information Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Final Compliance Review</h1>
              <p className="subtitle" style={{ margin: "0", fontSize: "0.95rem" }}>
                Tender: <strong style={{ color: "#0f172a" }}>GEM-CPCL-2026-001</strong> | Bidder: <strong style={{ color: "#0f172a" }}>ABC Engineering Pvt. Ltd.</strong> | Submission ID: <strong style={{ color: "#0f172a" }}>BID-2026-0045</strong>
              </p>
            </div>
            <button className="secondary-action-btn" onClick={() => setVerificationStep("matrix")} style={{ height: "36px", padding: "0 12px" }}>
              ← Back
            </button>
          </div>

          {/* Main Decision Split Grid */}
          <div className="dashboard-main-split">
            {/* Left Column */}
            <div className="split-left-col" style={{ flexGrow: 1.5 }}>
              {/* Compliance Score Card */}
              <div className="section-panel" style={{ padding: "24px", display: "flex", gap: "24px", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
                  <svg className="dial-svg" viewBox="0 0 100 100">
                    <circle className="dial-track" cx="50" cy="50" r="40" strokeWidth="8" />
                    <circle
                      className="dial-value"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      strokeDasharray={`${(92 / 100) * 251.2} 251.2`}
                      stroke="#10b981"
                    />
                  </svg>
                  <div className="dial-text">
                    <span className="dial-score" style={{ fontSize: "1.5rem", fontWeight: 800 }}>92</span>
                  </div>
                </div>
                <div>
                  <span className="card-label">Compliance Score</span>
                  <div style={{ marginTop: "6px" }}>
                    <span className="status-badge verified" style={{ fontSize: "0.75rem", background: "#10b981", color: "#ffffff", padding: "4px 8px" }}>
                      🟢 LOW RISK
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "24px", marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Mandatory Requirements</small>
                      <strong style={{ fontSize: "0.9rem" }}>9 / 10 Passed</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Documents</small>
                      <strong style={{ fontSize: "0.9rem" }}>10 / 10</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block" }}>Issues</small>
                      <strong style={{ fontSize: "0.9rem", color: "#f59e0b" }}>1 Review Required</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence-Based Compliance Table */}
              <div className="section-panel" style={{ padding: "20px", overflow: "hidden", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Evidence-Based Compliance</h2>
                <table style={{ margin: "0" }}>
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Result</th>
                      <th>Evidence</th>
                      <th>Verification</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PAN</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>PAN.pdf</td>
                      <td>Verified</td>
                      <td><strong>99%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>GST</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>GST Certificate</td>
                      <td>Verified</td>
                      <td><strong>98%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Udyam</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>Udyam Certificate</td>
                      <td>Verified</td>
                      <td><strong>97%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Income Tax</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>ITR Document</td>
                      <td>Verified</td>
                      <td><strong>94%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>OEM Authorization</strong></td>
                      <td><span style={{ color: "#f59e0b", fontWeight: 600 }}>REVIEW</span></td>
                      <td>OEM Authorization.pdf</td>
                      <td style={{ color: "#ef4444", fontWeight: 500 }}>Mismatch detected</td>
                      <td><strong style={{ color: "#f59e0b" }}>82%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Make in India</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>Declaration.pdf</td>
                      <td>Verified</td>
                      <td><strong>96%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Recommendation Card */}
              <div className="ai-assistant-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>AI Recommendation</h3>
                  <span className="status-badge review" style={{ fontSize: "0.8rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                    MANUAL REVIEW
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: "1.5", margin: "0 0 12px 0" }}>
                  "Most mandatory requirements are satisfied. One OEM authorization inconsistency requires officer confirmation."
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <LifeBuoy size={14} style={{ color: "#4f46e5" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5" }}>
                    AI recommendation is decision support only.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Evidence Viewer */}
            <div className="split-right-col" style={{ flexGrow: 1 }}>
              <div className="recent-activity-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 800 }}>OEM_Authorization.pdf</h3>
                  <span className="status-badge review" style={{ fontSize: "0.75rem" }}>Evidence Preview</span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", flexGrow: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Manufacturer</small>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>XYZ Pumps Ltd</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Bidder</small>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>ABC Engineering Pvt. Ltd.</strong>
                    </div>
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "12px" }}>
                      <small style={{ color: "#e11d48", display: "block", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>AI Finding</small>
                      <strong style={{ fontSize: "0.9rem", color: "#e11d48" }}>Potential entity-name mismatch</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>AI Explanation</small>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#475569", lineHeight: "1.5" }}>
                        "The document appears to authorize ABC Engineering Pvt. Ltd., but the manufacturer information requires manual confirmation."
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button className="secondary-action-btn" style={{ flexGrow: 1, height: "38px" }} onClick={() => alert("Opening OEM_Authorization.pdf document payload.")}>
                    Open Document
                  </button>
                  <button className="action-btn" style={{ flexGrow: 1, height: "38px", width: "auto" }} onClick={() => alert("Displaying raw JSON AI output token stream.")}>
                    View Extraction
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Final Decision Section */}
          <div className="section-panel" style={{ padding: "24px", marginTop: "24px", border: "1px solid #cbd5e1" }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "#0f172a" }}>Procurement Officer Decision</h2>
            
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
              <button
                className={`secondary-action-btn ${selectedDecision === "qualify" ? "active-decision qualify" : ""}`}
                style={{ flexGrow: 1, height: "46px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #10b981", color: "#10b981" }}
                onClick={() => setSelectedDecision("qualify")}
              >
                🟢 QUALIFY BID
              </button>
              <button
                className={`secondary-action-btn ${selectedDecision === "clarify" ? "active-decision clarify" : ""}`}
                style={{ flexGrow: 1, height: "46px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #f59e0b", color: "#f59e0b" }}
                onClick={() => setSelectedDecision("clarify")}
              >
                🟡 REQUEST CLARIFICATION
              </button>
              <button
                className={`secondary-action-btn ${selectedDecision === "disqualify" ? "active-decision disqualify" : ""}`}
                style={{ flexGrow: 1, height: "46px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #ef4444", color: "#ef4444" }}
                onClick={() => setSelectedDecision("disqualify")}
              >
                🔴 DISQUALIFY BID
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Decision Remarks</label>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Enter final decision remarks, compliance evaluation summaries, or reasonings..."
                style={{ width: "100%", height: "90px", borderRadius: "8px", border: "1px solid #cbd5e1", padding: "12px", fontSize: "0.9rem", color: "#0f172a", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <input
                type="checkbox"
                id="review-check"
                checked={reviewedCheckbox}
                onChange={(e) => setReviewedCheckbox(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="review-check" style={{ fontSize: "0.85rem", color: "#334155", cursor: "pointer", fontWeight: 500 }}>
                I have reviewed the supporting evidence and verification results.
              </label>
            </div>

            <button
              className="primary-action-btn"
              disabled={!reviewedCheckbox || !selectedDecision}
              onClick={() => {
                alert(`Decision Confirmed: Bid marked as ${selectedDecision.toUpperCase()}. Remarks saved.`);
                setVerificationStep("matrix");
              }}
              style={{ height: "44px", padding: "0 24px", borderRadius: "8px" }}
            >
              Confirm Decision
            </button>
          </div>

          {/* Audit Information Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Officer: <strong>Procurement Officer</strong>
              </span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Verification completed: <strong>28 Aug 2026, 12:24 PM</strong>
              </span>
            </div>
            <button className="secondary-action-btn" style={{ height: "30px", fontSize: "0.75rem", border: "none" }} onClick={() => setActiveSection("auditTrail")}>
              View Audit Trail
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="verification-dashboard-content">
        {/* Bid Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Bid Verification</h1>
            <p className="subtitle" style={{ margin: "0", fontSize: "0.95rem" }}>
              Tender: <strong style={{ color: "#0f172a" }}>GEM-CPCL-2026-001 — Supply of Industrial Pumps</strong>
            </p>
            <p className="subtitle" style={{ margin: "4px 0 0 0", fontSize: "0.95rem" }}>
              Bidder: <strong style={{ color: "#0f172a" }}>ABC Engineering Pvt. Ltd.</strong>
            </p>
          </div>
          <span className="status-badge review" style={{ fontSize: "0.85rem", padding: "8px 16px", borderRadius: "10px" }}>
            Under Verification
          </span>
        </div>

        {/* Top Summary Cards */}
        <div className="summary-cards-row" style={{ marginBottom: "24px" }}>
          <div className="summary-card">
            <span className="card-label">Compliance Score</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#10b981" }}>92 / 100</h2>
          </div>
          <div className="summary-card">
            <span className="card-label">Risk Level</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#3b82f6" }}>LOW</h2>
          </div>
          <div className="summary-card">
            <span className="card-label">Documents</span>
            <h2 className="card-value" style={{ marginTop: "10px" }}>10 / 10</h2>
          </div>
          <div className="summary-card">
            <span className="card-label" style={{ color: "#ef4444" }}>Issues Detected</span>
            <h2 className="card-value" style={{ marginTop: "10px", color: "#ef4444" }}>2</h2>
          </div>
        </div>

        {/* Verification Progress indicator */}
        <div className="tender-steps-indicator" style={{ marginBottom: "24px" }}>
          <div className="step active" style={{ color: "#10b981" }}>Document Processing ✓</div>
          <div className="step-line active" style={{ background: "#10b981" }}></div>
          <div className="step active" style={{ color: "#10b981" }}>AI Extraction ✓</div>
          <div className="step-line active" style={{ background: "#10b981" }}></div>
          <div className="step active" style={{ color: "#10b981" }}>Cross Verification ✓</div>
          <div className="step-line active" style={{ background: "#10b981" }}></div>
          <div className="step active" style={{ color: "#10b981" }}>Government Verification ✓</div>
          <div className="step-line active"></div>
          <div className="step active" style={{ color: "#4f46e5" }}>Compliance Engine ⏳</div>
        </div>

        {/* Main Split Layout */}
        <div className="dashboard-main-split">
          {/* Left Pane - Main Compliance Matrix */}
          <div className="split-left-col" style={{ flexGrow: 1.5 }}>
            <div className="section-panel" style={{ padding: "20px", overflow: "hidden" }}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Main Compliance Matrix</h2>
              <table style={{ margin: "0" }}>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Confidence</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>PAN</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>PAN.pdf</td>
                    <td><strong>99%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>GST</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>GST.pdf + GST API</td>
                    <td><strong>98%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Udyam</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>Udyam.pdf</td>
                    <td><strong>97%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Income Tax</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>ITR.pdf</td>
                    <td><strong>94%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>OEM Authorization</strong></td>
                    <td><span style={{ color: "#f59e0b", fontWeight: 600 }}>⚠ Review</span></td>
                    <td>OEM.pdf</td>
                    <td><strong style={{ color: "#f59e0b" }}>82%</strong></td>
                    <td>
                      <button className="primary-action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }} onClick={() => setVerificationStep("decision")}>
                        Review
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Make in India</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>Declaration.pdf</td>
                    <td><strong>96%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>EPFO</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>EPFO data</td>
                    <td><strong>95%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>ESIC</strong></td>
                    <td><span style={{ color: "#10b981", fontWeight: 600 }}>✓ Verified</span></td>
                    <td>ESIC data</td>
                    <td><strong>93%</strong></td>
                    <td>
                      <button className="action-btn" style={{ height: "28px", padding: "0 10px", fontSize: "0.75rem", width: "auto" }}>
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Pane - AI Findings and Document Evidence Preview */}
          <div className="split-right-col" style={{ flexGrow: 1 }}>
            {/* AI Findings Card */}
            <div className="ai-assistant-card" style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="ai-card-header">
                <h3 style={{ color: "#0f172a" }}>AI Findings <span className="sparkle-icon">✨</span></h3>
              </div>
              <ul className="ai-checks-list" style={{ marginTop: "16px", gap: "10px" }}>
                <li className="check-item warn" style={{ color: "#f59e0b" }}>
                  <AlertTriangle size={16} />
                  <span>OEM authorization contains a possible name mismatch.</span>
                </li>
                <li className="check-item warn" style={{ color: "#f59e0b" }}>
                  <AlertTriangle size={16} />
                  <span>Income-tax document date requires officer review.</span>
                </li>
                <li className="check-item checked" style={{ color: "#10b981" }}>
                  <CheckCircle2 size={16} />
                  <span>All other mandatory requirements appear compliant.</span>
                </li>
              </ul>
              <button className="assistant-action-btn" style={{ background: "#4f46e5", color: "#ffffff" }} onClick={() => setVerificationStep("decision")}>
                Review Issues
              </button>
            </div>

            {/* Evidence Preview Card */}
            <div className="recent-activity-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 800 }}>OEM_Authorization.pdf</h3>
                <span className="status-badge review" style={{ fontSize: "0.75rem" }}>Preview</span>
              </div>
              
              {/* Fake PDF container rendering with name mismatches highlighted */}
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "16px", fontSize: "0.8rem", fontFamily: "var(--mono)", color: "#334155", textAlign: "left", lineHeight: "1.6" }}>
                <div style={{ borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", marginBottom: "8px", color: "#64748b", fontWeight: "bold" }}>
                  MANUFACTURER CERTIFICATION MATRIX
                </div>
                <p>Date: 12 July 2026</p>
                <p>We, <strong>Industrial Pumps Ltd (OEM)</strong> hereby authorize:</p>
                <p style={{ background: "#fef3c7", borderLeft: "4px solid #f59e0b", padding: "6px", fontWeight: "bold", color: "#b45309" }}>
                  ABC Engineering Corp
                </p>
                <p>to bid, negotiate, and conclude contracts for Tender ID GEM-CPCL-2026-001.</p>
                <div style={{ marginTop: "12px", borderTop: "1px dashed #cbd5e1", paddingTop: "6px", color: "#f43f5e", fontSize: "0.75rem", fontWeight: "bold" }}>
                  * OCR mismatch warning: Extracted name 'ABC Engineering Corp' does not align with Registry registered legal name 'ABC Engineering Pvt. Ltd.'.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bottom-actions-row">
          <button className="secondary-action-btn" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={() => alert("Clarification request compiled. Email queued to bidder admin.")}>
            Request Clarification
          </button>
          <button className="primary-action-btn" onClick={() => setVerificationStep("decision")}>
            Continue Review
          </button>
        </div>
      </div>
    );
  };

  const ReportsView = () => {
    return (
      <div className="section-panel" style={{ padding: "30px" }}>
        <h2>AI Insights & Platform Reports</h2>
        <p className="subtitle" style={{ marginBottom: "20px" }}>
          Statistical reports regarding automated bid verification parameters, confidence ratings, and anomaly detections.
        </p>
        <div className="stats-grid" style={{ marginBottom: "30px" }}>
          <div className="stat-card purple">
            <p>AUTOMATIC VERIFIED</p>
            <h2>86%</h2>
            <span className="stat-icon"><CheckCircle2 size={20} /></span>
          </div>
          <div className="stat-card green">
            <p>CONFIDENCE INDEX</p>
            <h2>91%</h2>
            <span className="stat-icon"><TrendingUp size={20} /></span>
          </div>
          <div className="stat-card orange">
            <p>TOTAL ANOMALIES</p>
            <h2>12</h2>
            <span className="stat-icon"><AlertTriangle size={20} /></span>
          </div>
          <div className="stat-card blue">
            <p>MANUAL AUDIT REQ</p>
            <h2>07</h2>
            <span className="stat-icon"><Sliders size={20} /></span>
          </div>
        </div>
      </div>
    );
  };

  const AuditTrailView = () => {
    const allLogs = bids.flatMap((b) => b.logs.map((log) => ({ bidId: b.id, log })));

    return (
      <div className="section-panel" style={{ padding: "30px" }}>
        <h2>Cryptographic Audit Trail Console</h2>
        <p className="subtitle" style={{ marginBottom: "20px" }}>
          Consolidated platform verification traces and security event logs.
        </p>
        <div className="terminal-window" style={{ marginTop: "0" }}>
          <div className="terminal-body" style={{ height: "400px" }}>
            {allLogs.map((item, idx) => {
              let typeClass = "info";
              if (item.log.includes("WARNING") || item.log.includes("Penalty")) typeClass = "warning";
              if (item.log.includes("CRITICAL") || item.log.includes("mismatch")) typeClass = "danger";
              if (item.log.includes("completed") || item.log.includes("Verified") || item.log.includes("confirmed")) typeClass = "success";
              return (
                <div key={idx} className={`term-line ${typeClass}`}>
                  <strong>[{item.bidId}]</strong> {item.log}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // New Create Tender view
  const CreateTenderView = () => {
    return (
      <div className="create-tender-content">
        {/* Page Header */}
        <div className="welcome-banner">
          <h1>Create New Tender</h1>
          <p className="subtitle">Define tender information and compliance requirements.</p>
        </div>

        {/* Multi-step progress indicator */}
        <div className="tender-steps-indicator">
          <div className="step active"><span className="step-num">1</span> Basic Details</div>
          <div className="step-line active"></div>
          <div className="step"><span className="step-num">2</span> Requirements</div>
          <div className="step-line"></div>
          <div className="step"><span className="step-num">3</span> Documents</div>
          <div className="step-line"></div>
          <div className="step"><span className="step-num">4</span> Review</div>
          <div className="step-line"></div>
          <div className="step"><span className="step-num">5</span> Publish</div>
        </div>

        {/* Split Form Layout */}
        <div className="dashboard-main-split">
          {/* Left Column - Basic Information Form */}
          <div className="split-left-col">
            <div className="section-panel" style={{ padding: "30px" }}>
              <h2 style={{ marginBottom: "20px" }}>Basic Tender Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Tender ID</label>
                  <input type="text" defaultValue="GEM-CPCL-2026-001" disabled className="disabled-input" />
                </div>
                <div className="form-group">
                  <label>Tender Title</label>
                  <input type="text" defaultValue="Supply of Industrial Pumps" />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input type="text" defaultValue="Chennai Petroleum Corporation Limited" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" defaultValue="Procurement Department" />
                </div>
                <div className="form-group">
                  <label>Tender Category</label>
                  <input type="text" defaultValue="Industrial Equipment" />
                </div>
                <div className="form-group animate-pulse">
                  <label>Estimated Value</label>
                  <input type="text" defaultValue="₹50,00,000" />
                </div>
                <div className="form-group">
                  <label>Submission Deadline</label>
                  <input type="text" defaultValue="30 September 2026" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - AI Upload Assistant */}
          <div className="split-right-col">
            <div className="ai-assistant-card" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)" }}>
              <div className="ai-card-header">
                <h3>AI Requirement Assistant <span className="sparkle-icon">✨</span></h3>
              </div>
              <p className="ai-message" style={{ margin: "10px 0 20px 0", fontSize: "0.85rem", color: "#c7d2fe" }}>
                "Upload the tender document and AI will automatically identify eligibility and compliance requirements."
              </p>
              
              {/* Dropzone Upload */}
              <div className="tender-dropzone">
                <CloudUpload size={32} style={{ color: "#c7d2fe", marginBottom: "10px" }} />
                <span>Drag & Drop Tender PDF</span>
                <small style={{ color: "#94a3b8", marginTop: "4px" }}>or click to browse local files</small>
              </div>

              <button className="assistant-action-btn" style={{ marginTop: "20px" }} onClick={() => alert("AI Analysis: Identified 14 eligibility markers, 5 MSME clauses, and 3 cryptographic certificate guidelines.")}>
                Extract Requirements with AI
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bottom-actions-row">
          <button className="secondary-action-btn" onClick={() => setActiveSection("tenders")}>
            Save Draft
          </button>
          <button className="primary-action-btn" onClick={() => alert("Requirements definition compiled. Navigating to compliance criteria verification page.")}>
            Next: Requirements →
          </button>
        </div>
      </div>
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
                    { label: "Officer Name", value: user ? user.full_name : "Dr. Shashi Kumar (Auditor)" },
                    { label: "Clearance Authority", value: "GeM Audit Division" },
                    { label: "Clearance Level", value: user?.role === "ADMIN" ? "Super Administrator" : "Level-3 Compliance Officer" },
                    { label: "Officer Email", value: user ? user.email : "officer@gem.gov.in" }
                  ]
                : [
                    { label: "Full Name", value: user ? user.full_name : "ABC Engineering Pvt. Ltd." },
                    { label: "Supplier Email", value: user ? user.email : "supplier@gem.gov.in" },
                    { label: "Sovereign Clearing ID", value: user ? user.id : "N/A" },
                    { label: "Verified Role", value: user ? user.role : "BIDDER" }
                  ]
            }
          />
        );
      case "documents":
        return <DocumentUploadPage onAddBid={handleAddBid} />;
      case "myBids":
        return <MyBidsSection />;
      case "tenders":
        return role === "Buyer" ? <TendersView /> : <TendersSection />;
      case "createTender":
        return <CreateTenderView />;
      case "bidders":
        return <BiddersView />;
      case "verification":
        return <VerificationView />;
      case "reports":
        return <ReportsView />;
      case "auditTrail":
        return <AuditTrailView />;
      case "notifications":
        return <NotificationsSection />;
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
        return role === "Buyer" ? <BuyerDashboardView /> : <BidderDashboardView />;
    }
  };

  // If role is Supplier (Bidder), return the modern premium top-nav full-width layout
  if (role === "Supplier") {
    return (
      <div className="bidder-dashboard-layout">
        <header className="bidder-header">
          <div className="bidder-header-left">
            <div className="bidder-logo" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img
                src="/logo.png"
                alt="BidVerify Logo"
                style={{ height: "72px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
              />
              <div className="logo-text-block" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span className="logo-title" style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
                  BidVerify
                </span>
                <span className="logo-subtitle" style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.3px", marginTop: "2px", textTransform: "uppercase" }}>
                  Government e-Auction & Compliance Platform
                </span>
              </div>
            </div>
          </div>

          <nav className="bidder-nav">
            <button
              className={activeSection === "dashboard" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={activeSection === "myBids" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("myBids")}
            >
              My Bids
            </button>
            <button
              className={activeSection === "documents" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("documents")}
            >
              Documents
            </button>
            <button
              className={activeSection === "tenders" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("tenders")}
            >
              Tenders
            </button>
            <button
              className={activeSection === "notifications" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("notifications")}
            >
              Notifications
            </button>
          </nav>

          <div className="bidder-header-right">
            <button className="icon-btn"><Search size={18} /></button>
            <button className="icon-btn relative" onClick={() => setActiveSection("notifications")}>
              <Bell size={18} />
              <span className="notification-dot"></span>
            </button>

            <div className="user-profile-dropdown" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
              <img src={profileImage} alt="User Profile" className="avatar-img" />
              <span className="company-name">{user ? user.full_name : "ABC Engineering Pvt. Ltd."}</span>
              <ChevronDown size={14} className="dropdown-arrow" />

              {userDropdownOpen && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => setActiveSection("profile")}>
                    My Profile
                  </button>
                  <button className="dropdown-item signout-item" onClick={onLogout}>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Government Live Ticker Bar */}
        <div className="gov-ticker-bar">
          <span className="ticker-badge">📢 LIVE ANNOUNCEMENTS</span>
          <div className="ticker-wrapper">
            <span className="ticker-text">
              ✦ Welcome to BidVerify Government e-Auction & Compliance Verification Portal ✦ Real-Time GSTIN, PAN, Udyam MSME & OEM Authorization Verification Active ✦ Tender GEM-CPCL-2026-001 Live ✦ Helpdesk: 1800-425-8888 (Toll Free) ✦
            </span>
          </div>
        </div>

        <main className="bidder-main">
          <section className="bidder-content">{renderContent()}</section>
        </main>

        {/* Selected Bid details inspection drawer for Supplier */}
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
                <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ position: "relative", width: "90px", height: "90px" }}>
                    <svg className="dial-svg" viewBox="0 0 100 100">
                      <circle className="dial-track" cx="50" cy="50" r="40" strokeWidth="8" />
                      <circle
                        className="dial-value"
                        cx="50"
                        cy="50"
                        r="40"
                        strokeWidth="8"
                        strokeDasharray={`${(selectedBid.score / 100) * 251.2} 251.2`}
                        stroke={selectedBid.score >= 85 ? "#10b981" : selectedBid.score >= 50 ? "#f59e0b" : "#ef4444"}
                      />
                    </svg>
                    <div className="dial-text">
                      <span className="dial-score" style={{ fontSize: "1.25rem" }}>{selectedBid.score}</span>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>Compliance Score & Risk</h3>
                    <span className={`risk-badge ${selectedBid.risk.toLowerCase()}`}>
                      {selectedBid.risk} Risk Rating
                    </span>
                    <span className={`status-badge ${selectedBid.status.toLowerCase().replace(" ", "")}`} style={{ marginLeft: "10px" }}>
                      {selectedBid.status}
                    </span>
                  </div>
                </div>

                {/* Cross Registry Verification Details */}
                <div className="cross-verification-box">
                  <h4 style={{ fontSize: "0.9rem", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
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
                        <td>{selectedBid.gstin || <em style={{ color: "#ef4444" }}>Missing</em>}</td>
                        <td>{selectedBid.bidderName}</td>
                        <td>
                          {selectedBid.gstin ? (
                            <span style={{ color: "#10b981", fontWeight: 600 }}>Active ✓</span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: 600 }}>Not Provided ✕</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>PAN</strong></td>
                        <td>{selectedBid.pan || <em style={{ color: "#ef4444" }}>Missing</em>}</td>
                        <td>{selectedBid.bidderName}</td>
                        <td>
                          {selectedBid.pan ? (
                            <span style={{ color: "#10b981", fontWeight: 600 }}>Active ✓</span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: 600 }}>Not Provided ✕</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Udyam MSME</strong></td>
                        <td>{selectedBid.udyam || <em>Not Provided</em>}</td>
                        <td>{selectedBid.udyam ? selectedBid.bidderName : "N/A"}</td>
                        <td>
                          {selectedBid.udyam ? (
                            <span style={{ color: "#10b981", fontWeight: 600 }}>Verified ✓</span>
                          ) : (
                            <span style={{ color: "#f59e0b", fontWeight: 600 }}>Exempt / Missing</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Warnings List */}
                {selectedBid.warnings && selectedBid.warnings.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Integrity Assessment & Deductions</h4>
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
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Buyer (Officer) Premium Dashboard Layout
  return (
    <div className="bidder-dashboard-layout">
      <header className="bidder-header">
        <div className="bidder-header-left">
          <div className="bidder-logo" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src="/logo.png"
              alt="BidVerify Logo"
              style={{ height: "72px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
            />
            <div className="logo-text-block" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span className="logo-title" style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
                BidVerify
              </span>
              <span className="logo-subtitle" style={{ fontSize: "0.78rem", fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.3px", marginTop: "2px", textTransform: "uppercase" }}>
                Government e-Auction & Compliance Platform
              </span>
            </div>
          </div>
        </div>

        <nav className="bidder-nav">
          {navigationItems.map(({ id, label }) => (
            <button
              key={id}
              className={activeSection === id || (id === "tenders" && activeSection === "createTender") ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="bidder-header-right">
          <button className="icon-btn"><Search size={18} /></button>
          <button className="icon-btn relative" onClick={() => setActiveSection("notifications")}>
            <Bell size={18} />
            <span className="notification-dot"></span>
          </button>

          <div className="user-profile-dropdown" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
            <img src={profileImage} alt="User Profile" className="avatar-img" />
            <span className="company-name">{user ? user.full_name : "Procurement Officer"}</span>
            <ChevronDown size={14} className="dropdown-arrow" />

            {userDropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => setActiveSection("profile")}>
                  My Profile
                </button>
                <button className="dropdown-item signout-item" onClick={onLogout}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Government Live Ticker Bar */}
      <div className="gov-ticker-bar">
        <span className="ticker-badge">📢 LIVE ANNOUNCEMENTS</span>
        <div className="ticker-wrapper">
          <span className="ticker-text">
            ✦ BidVerify Officer Administrative Console ✦ Automated Cross-Verification with GST, Income Tax, EPFO, & MSME Udyam Registries Active ✦ 12 Integrity Alerts Flagged ✦
          </span>
        </div>
      </div>

      <main className="bidder-main">
        <section className="bidder-content">{renderContent()}</section>
      </main>

      {/* Selected Bid details inspection drawer for Officer */}
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
              <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ position: "relative", width: "90px", height: "90px" }}>
                  <svg className="dial-svg" viewBox="0 0 100 100">
                    <circle className="dial-track" cx="50" cy="50" r="40" strokeWidth="8" />
                    <circle
                      className="dial-value"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      strokeDasharray={`${(selectedBid.score / 100) * 251.2} 251.2`}
                      stroke={selectedBid.score >= 85 ? "#10b981" : selectedBid.score >= 50 ? "#f59e0b" : "#ef4444"}
                    />
                  </svg>
                  <div className="dial-text">
                    <span className="dial-score" style={{ fontSize: "1.25rem" }}>{selectedBid.score}</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>Compliance Score & Risk</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "left", marginBottom: "8px" }}>
                    Weighted registry status and name matching analysis.
                  </p>
                  <span className={`risk-badge ${selectedBid.risk.toLowerCase()}`}>
                    {selectedBid.risk} Risk Rating
                  </span>
                  <span className={`status-badge ${selectedBid.status.toLowerCase().replace(" ", "")}`} style={{ marginLeft: "10px" }}>
                    {selectedBid.status}
                  </span>
                </div>
              </div>

              {/* Cross Registry Verification Details */}
              <div className="cross-verification-box">
                <h4 style={{ fontSize: "0.9rem", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
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
                      <td>{selectedBid.gstin || <em style={{ color: "#ef4444" }}>Missing</em>}</td>
                      <td>{selectedBid.bidderName}</td>
                      <td>
                        {selectedBid.gstin ? (
                          <span style={{ color: "#10b981", fontWeight: 600 }}>Active ✓</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 600 }}>Not Provided ✕</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>PAN</strong></td>
                      <td>{selectedBid.pan || <em style={{ color: "#ef4444" }}>Missing</em>}</td>
                      <td>{selectedBid.bidderName}</td>
                      <td>
                        {selectedBid.pan ? (
                          <span style={{ color: "#10b981", fontWeight: 600 }}>Active ✓</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontWeight: 600 }}>Not Provided ✕</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Udyam MSME</strong></td>
                      <td>{selectedBid.udyam || <em>Not Provided</em>}</td>
                      <td>{selectedBid.udyam ? selectedBid.bidderName : "N/A"}</td>
                      <td>
                        {selectedBid.udyam ? (
                          <span style={{ color: "#10b981", fontWeight: 600 }}>Verified ✓</span>
                        ) : (
                          <span style={{ color: "#f59e0b", fontWeight: 600 }}>Exempt / Missing</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Warnings List */}
              {selectedBid.warnings && selectedBid.warnings.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Integrity Assessment & Deductions</h4>
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
                <h4 style={{ fontSize: "0.9rem", marginBottom: "10px" }}>Audit Execution Console Trace</h4>
                <div className="terminal-window" style={{ marginTop: "0" }}>
                  <div className="terminal-body" style={{ height: "180px" }}>
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

              <div className="audit-action-sheet">
                <label>Auditor Sign-Off & Review Notes</label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter audit validation comments, details regarding requested revision documents, or justification notes..."
                />
              </div>
            </div>

            <div className="drawer-actions">
              <button type="button" className="approve-btn" onClick={() => handleAuditAction(selectedBid.id, "Verified")}>
                Approve Bid Compliance
              </button>
              <button type="button" className="reject-btn" onClick={() => handleAuditAction(selectedBid.id, "Rejected")}>
                Reject Bid / Request Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;