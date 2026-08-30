import { useState, useEffect } from "react";
import profileImage from "../assets/profile.png";
import "../App.css";
import DocumentUploadPage from "./DocumentUpload";
import StatusPage from "./Status";
import BidderProfile from "./BidderProfile";
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
  Users,
  UserCheck,
  UserPlus,
  ShieldAlert,
  UserX,
  Phone,
  Mail,
  MapPin,
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
  ChevronRight,
  FolderOpen,
  ClipboardList,
  FileText,
  Lock,
  ShieldCheck,
  Check,
  ExternalLink,
  Eye,
  Sparkles,
  Award,
  Calendar,
  CheckSquare,
  Filter,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Download,
  ArrowLeft,
  Info,
  Clock,
  Maximize2
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
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/bidder/profile") {
      return "profile";
    }
    return "dashboard";
  });

  useEffect(() => {
    if (activeSection === "profile") {
      if (window.location.pathname !== "/bidder/profile") {
        window.history.pushState(null, "", "/bidder/profile");
      }
    } else if (window.location.pathname === "/bidder/profile" && activeSection !== "profile") {
      window.history.pushState(null, "", "/");
    }
  }, [activeSection]);

  const [bids, setBids] = useState(INITIAL_BIDS);
  const [selectedBid, setSelectedBid] = useState(null);
  const [selectedTender, setSelectedTender] = useState(null);
  const [officerNotes, setOfficerNotes] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [biddersInitialFilter, setBiddersInitialFilter] = useState({ risk: "All", verification: "All" });
  const [selectedTenderForBidders, setSelectedTenderForBidders] = useState(null);
  const [selectedVerificationBidder, setSelectedVerificationBidder] = useState(null);
  const [decidedBids, setDecidedBids] = useState({});

  const handleAddBid = (newBid) => {
    setBids((prev) => [newBid, ...prev]);
  };

  const handleSubmitBid = (tenderId) => {
    const targetBid = bids.find((b) => b.id === tenderId) || bids[0] || INITIAL_BIDS[0];
    setSelectedBid(targetBid);
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

  // Admin role check (Integrations tab is exclusive to Super Admin)
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const navigationItems = role === "Buyer"
    ? (isAdmin ? [...buyerNav.slice(0, 5), { id: "integrations", label: "Integrations" }, ...buyerNav.slice(5)] : buyerNav)
    : supplierNav;

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
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          className="table-action-btn emerald"
                          onClick={() => setActiveSection("documents")}
                        >
                          Create Bid →
                        </button>
                        <button
                          className="secondary-action-btn"
                          onClick={() => setSelectedTender(tender)}
                        >
                          View Details
                        </button>
                      </div>
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

  // Buyer (Officer) views for tabs - Matching exact enterprise dashboard layout
  const BuyerDashboardView = () => {
    return (
      <div className="officer-dashboard-main-wrapper" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ROW 1: TOP 5 SUMMARY KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {/* Card 1: Active Tenders */}
          <div
            className="kpi-card-box"
            onClick={() => setActiveSection("tenders")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>ACTIVE TENDERS</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>08</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <span>3 closing within 7 days</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Card 2: Total Bids */}
          <div
            className="kpi-card-box"
            onClick={() => setActiveSection("bidders")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>TOTAL BIDS</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                <User size={18} />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>126</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <span>Across current tenders</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Card 3: Pending Verification */}
          <div
            className="kpi-card-box"
            onClick={() => setActiveSection("bidders")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>PENDING VERIFICATION</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                <Clock3 size={18} />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>18</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <span>Requires your review</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Card 4: High Risk */}
          <div
            className="kpi-card-box"
            onClick={() => setActiveSection("bidders")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>HIGH RISK</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>07</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <span>Requires attention</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Card 5: Completed */}
          <div
            className="kpi-card-box"
            onClick={() => setActiveSection("bidders")}
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>COMPLETED</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1 }}>101</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <span>Verification completed</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: COMPLIANCE HEALTH & ACTION REQUIRED */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* COMPLIANCE HEALTH */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "0 0 18px 0", letterSpacing: "0.02em" }}>COMPLIANCE HEALTH</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {/* Circular Gauge */}
              <div style={{ position: "relative", width: "175px", height: "175px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="175" height="175" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)", width: "175px", height: "175px" }}>
                  <circle cx="70" cy="70" r="56" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle
                    cx="70"
                    cy="70"
                    r="56"
                    fill="none"
                    stroke="#0b3b8c"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(82 / 100) * 351.85} 351.85`}
                  />
                </svg>
                <div style={{ position: "absolute", width: "115px", textAlign: "center", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", lineHeight: 1, margin: 0, display: "block" }}>82%</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a", marginTop: "4px", lineHeight: 1.2, display: "block" }}>Overall Compliance</span>
                  <span style={{ fontSize: "0.6rem", color: "#64748b", marginTop: "3px", lineHeight: 1.15, display: "block", width: "100%" }}>Compared with current active bids</span>
                </div>
              </div>

              {/* Progress Breakdown */}
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", margin: "0 0 4px 0" }}>Compliance Breakdown</h4>

                {/* Verified */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "3px" }}>
                    <span>Verified <small style={{ color: "#94a3b8" }}>82 bids</small></span>
                    <strong>82%</strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "82%", height: "100%", background: "#22c55e", borderRadius: "3px" }}></div>
                  </div>
                </div>

                {/* Pending */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "3px" }}>
                    <span>Pending <small style={{ color: "#94a3b8" }}>18 bids</small></span>
                    <strong>18%</strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "18%", height: "100%", background: "#f97316", borderRadius: "3px" }}></div>
                  </div>
                </div>

                {/* Requires Review */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "3px" }}>
                    <span>Requires Review <small style={{ color: "#94a3b8" }}>12 bids</small></span>
                    <strong>12%</strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "12%", height: "100%", background: "#2563eb", borderRadius: "3px" }}></div>
                  </div>
                </div>

                {/* High Risk */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#475569", marginBottom: "3px" }}>
                    <span>High Risk <small style={{ color: "#94a3b8" }}>7 bids</small></span>
                    <strong>7%</strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: "7%", height: "100%", background: "#ef4444", borderRadius: "3px" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Light Blue Info Box */}
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "12px 14px", marginTop: "18px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <HelpCircle size={18} style={{ color: "#0284c7", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ fontSize: "0.8rem", color: "#0369a1", display: "block" }}>Compliance Status</strong>
                <p style={{ fontSize: "0.76rem", color: "#0c4a6e", margin: "2px 0 0 0", lineHeight: 1.4 }}>
                  Most submitted bids are compliant, but several bids require Procurement Officer review before final qualification.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION REQUIRED */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "22px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.02em" }}>ACTION REQUIRED</h3>
              <button
                onClick={() => setActiveSection("bidders")}
                style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
              >
                View All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1, justifyContent: "space-between" }}>
              {/* Card 1: High Priority */}
              <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderLeft: "4px solid #ef4444", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#dc2626", letterSpacing: "0.04em", textTransform: "uppercase" }}>HIGH PRIORITY</span>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", margin: "2px 0 2px 0" }}>ABC Industries Pvt Ltd</h4>
                  <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Tender: CPCL/2026/001</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.76rem", color: "#334155", marginBottom: "2px" }}>Issue: <strong>OEM Authorization appears expired</strong></div>
                  <div style={{ fontSize: "0.76rem", color: "#dc2626", fontWeight: 700, marginBottom: "8px" }}>Risk: High</div>
                </div>
                <button
                  onClick={() => setActiveSection("verification")}
                  style={{ background: "#ffffff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Review Bid
                </button>
              </div>

              {/* Card 2: Medium Priority */}
              <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderLeft: "4px solid #f59e0b", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#d97706", letterSpacing: "0.04em", textTransform: "uppercase" }}>MEDIUM PRIORITY</span>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", margin: "2px 0 2px 0" }}>XYZ Engineering Ltd</h4>
                  <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Tender: CPCL/2026/002</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.76rem", color: "#334155", marginBottom: "2px" }}>Issue: <strong>GST return verification pending</strong></div>
                  <div style={{ fontSize: "0.76rem", color: "#d97706", fontWeight: 700, marginBottom: "8px" }}>Risk: Medium</div>
                </div>
                <button
                  onClick={() => setActiveSection("verification")}
                  style={{ background: "#ffffff", border: "1px solid #fde68a", color: "#d97706", borderRadius: "6px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Review Bid
                </button>
              </div>

              {/* Card 3: Pending */}
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderLeft: "4px solid #0284c7", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#0284c7", letterSpacing: "0.04em", textTransform: "uppercase" }}>PENDING</span>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", margin: "2px 0 2px 0" }}>DEF Enterprises</h4>
                  <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Tender: CPCL/2026/003</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.76rem", color: "#334155", marginBottom: "2px" }}>Issue: <strong>2 documents pending verification</strong></div>
                  <div style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 700, marginBottom: "8px" }}>Risk: —</div>
                </div>
                <button
                  onClick={() => setActiveSection("verification")}
                  style={{ background: "#ffffff", border: "1px solid #93c5fd", color: "#2563eb", borderRadius: "6px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Review Bid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: ACTIVE TENDERS TABLE & (CLOSING SOON + RISK DISTRIBUTION) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>

          {/* ACTIVE TENDERS TABLE */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.02em" }}>ACTIVE TENDERS</h3>
              <button
                onClick={() => setActiveSection("tenders")}
                style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
              >
                View All
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.04em", textAlign: "left" }}>
                    <th style={{ padding: "10px 8px" }}>Tender ID</th>
                    <th style={{ padding: "10px 8px" }}>Tender Title</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>Bidders</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>Pending</th>
                    <th style={{ padding: "10px 8px", textAlign: "center" }}>High Risk</th>
                    <th style={{ padding: "10px 8px" }}>Closing Date</th>
                    <th style={{ padding: "10px 8px" }}>Status</th>
                    <th style={{ padding: "10px 8px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/001</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Industrial Equipment Supply</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>12</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>5</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>30 Aug 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/002</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Pipeline Components</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>18</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>3</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>02 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/003</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Electrical Materials Supply</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>9</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>0</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>05 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#fff7ed", color: "#ea580c", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Closing Soon</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/004</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Maintenance Services</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>7</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>10 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/005</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Safety Equipment Supply</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>11</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>15 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#64748b" }}>
              <span>Showing 1 to 5 of 8 tenders</span>
              <button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                View All Tenders <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN SPLIT: TENDERS CLOSING SOON & BID RISK DISTRIBUTION */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* TENDERS CLOSING SOON */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.02em" }}>TENDERS CLOSING SOON</h3>
                <button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>View All</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.78rem" }}>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>CPCL/2026/001</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>30 Aug 2026</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span>12 Bids</span>
                    <strong style={{ color: "#ef4444" }}>5 Pending</strong>
                    <button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View</button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "0.78rem" }}>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>CPCL/2026/002</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>02 Sep 2026</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span>18 Bids</span>
                    <strong style={{ color: "#ef4444" }}>3 Pending</strong>
                    <button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View</button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: "0.78rem" }}>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>CPCL/2026/003</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>05 Sep 2026</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span>9 Bids</span>
                    <strong style={{ color: "#ef4444" }}>2 Pending</strong>
                    <button onClick={() => setActiveSection("tenders")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View</button>
                  </div>
                </div>
              </div>
            </div>

            {/* BID RISK DISTRIBUTION */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0", letterSpacing: "0.02em" }}>BID RISK DISTRIBUTION</h3>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Donut Chart */}
                <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="176.6 238.7" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="47.7 238.7" strokeDashoffset="-176.6" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="14.3 238.7" strokeDashoffset="-224.3" />
                  </svg>
                  <div style={{ position: "absolute", textAlign: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: "0.62rem", color: "#64748b", display: "block" }}>Total Bids</span>
                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>126</strong>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#22c55e" }}></span>
                      <span style={{ color: "#334155" }}>Low Risk</span>
                    </div>
                    <div>
                      <strong>74%</strong> <small style={{ color: "#64748b" }}>(93 Bids)</small>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f97316" }}></span>
                      <span style={{ color: "#334155" }}>Medium Risk</span>
                    </div>
                    <div>
                      <strong>20%</strong> <small style={{ color: "#64748b" }}>(25 Bids)</small>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ef4444" }}></span>
                      <span style={{ color: "#334155" }}>High Risk</span>
                    </div>
                    <div>
                      <strong>6%</strong> <small style={{ color: "#64748b" }}>(8 Bids)</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ROW 4: RECENT VERIFICATION ACTIVITY & QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

          {/* RECENT VERIFICATION ACTIVITY */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "0.02em" }}>RECENT VERIFICATION ACTIVITY</h3>
              <button onClick={() => setActiveSection("auditTrail")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>View All</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>AI document analysis completed</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>ABC Industries Pvt Ltd</span>
                  </div>
                </div>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>5 minutes ago</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>📄</div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>Document requires officer review</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>XYZ Engineering Ltd</span>
                  </div>
                </div>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>18 minutes ago</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>🚨</div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>High-risk issue detected</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>DEF Enterprises</span>
                  </div>
                </div>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>42 minutes ago</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>Bid verification completed</strong>
                    <span style={{ color: "#64748b", fontSize: "0.72rem" }}>GHI Technologies</span>
                  </div>
                </div>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>1 hour ago</span>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0", letterSpacing: "0.02em" }}>QUICK ACTIONS</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Tile 1: Create Tender */}
              <button
                onClick={() => setActiveSection("createTender")}
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800 }}>+</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d4ed8" }}>Create Tender</span>
              </button>

              {/* Tile 2: Review Pending Bids */}
              <button
                onClick={() => setActiveSection("bidders")}
                style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <div style={{ width: "28px", height: "28px", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>🔍</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#c2410c" }}>Review Pending Bids</span>
              </button>

              {/* Tile 3: View High Risk Bids */}
              <button
                onClick={() => setActiveSection("bidders")}
                style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <div style={{ width: "28px", height: "28px", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>🚨</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b91c1c" }}>View High Risk Bids</span>
              </button>

              {/* Tile 4: View Active Tenders */}
              <button
                onClick={() => setActiveSection("tenders")}
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                <div style={{ width: "28px", height: "28px", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>📁</div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d" }}>View Active Tenders</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // Tenders Management View - Pixel perfect match to reference design
  const TendersView = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [closingSoonOnly, setClosingSoonOnly] = useState(false);
    const [activeKpi, setActiveKpi] = useState("ALL");
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const ALL_TENDERS = [
      { id: "CPCL/2026/001", title: "Industrial Equipment Supply", category: "Equipment", department: "Projects", publishedDate: "08 May 2026", closingDate: "30 May 2026", daysLeft: "2 days left", bidders: 12, pending: 5, status: "Active" },
      { id: "CPCL/2026/002", title: "Pipeline Components", category: "Infrastructure", department: "Projects", publishedDate: "06 May 2026", closingDate: "02 Jun 2026", daysLeft: "5 days left", bidders: 18, pending: 3, status: "Active" },
      { id: "CPCL/2026/003", title: "Electrical Materials Supply", category: "Electrical", department: "Engineering", publishedDate: "05 May 2026", closingDate: "10 Jun 2026", daysLeft: "7 days left", bidders: 9, pending: 2, status: "Active" },
      { id: "CPCL/2026/004", title: "Maintenance Services", category: "Services", department: "Operations", publishedDate: "01 May 2026", closingDate: "15 Jun 2026", daysLeft: "18 days left", bidders: 7, pending: 1, status: "Active" },
      { id: "CPCL/2026/005", title: "Safety Equipment Supply", category: "Safety", department: "Operations", publishedDate: "30 Apr 2026", closingDate: "20 Jun 2026", daysLeft: "23 days left", bidders: 11, pending: 2, status: "Active" },
      { id: "CPCL/2026/006", title: "Office Furniture Supply", category: "General", department: "Admin", publishedDate: "20 Apr 2026", closingDate: "25 Apr 2026", daysLeft: null, bidders: 6, pending: 0, status: "Closed" },
      { id: "CPCL/2026/007", title: "Civil Construction Works", category: "Works", department: "Projects", publishedDate: "10 Apr 2026", closingDate: "18 Apr 2026", daysLeft: null, bidders: 15, pending: 0, status: "Closed" },
      { id: "CPCL/2026/008", title: "Canteen Services", category: "Services", department: "Admin", publishedDate: "05 Apr 2026", closingDate: "12 Apr 2026", daysLeft: null, bidders: 5, pending: 0, status: "Cancelled" },
    ];

    // Closing soon helper (7 days or less)
    const isClosingSoon = (t) => {
      if (!t.daysLeft || t.status !== "Active") return false;
      const num = parseInt(t.daysLeft, 10);
      return !isNaN(num) && num <= 7;
    };

    // Calculate dynamic counts
    const totalCount = String(ALL_TENDERS.length).padStart(2, "0");
    const activeCount = String(ALL_TENDERS.filter(t => t.status === "Active").length).padStart(2, "0");
    const closingSoonCount = String(ALL_TENDERS.filter(isClosingSoon).length).padStart(2, "0");
    const closedCount = String(ALL_TENDERS.filter(t => t.status === "Closed").length).padStart(2, "0");
    const cancelledCount = String(ALL_TENDERS.filter(t => t.status === "Cancelled").length).padStart(2, "0");

    const handleKpiFilter = (type) => {
      setActiveKpi(type);
      if (type === "ALL") {
        setStatusFilter("All");
        setClosingSoonOnly(false);
      } else if (type === "ACTIVE") {
        setStatusFilter("Active");
        setClosingSoonOnly(false);
      } else if (type === "CLOSING_SOON") {
        setStatusFilter("All");
        setClosingSoonOnly(true);
      } else if (type === "CLOSED") {
        setStatusFilter("Closed");
        setClosingSoonOnly(false);
      } else if (type === "CANCELLED") {
        setStatusFilter("Cancelled");
        setClosingSoonOnly(false);
      }
    };

    const handleStatusDropdownChange = (val) => {
      setStatusFilter(val);
      setClosingSoonOnly(false);
      if (val === "All") setActiveKpi("ALL");
      else if (val === "Active") setActiveKpi("ACTIVE");
      else if (val === "Closed") setActiveKpi("CLOSED");
      else if (val === "Cancelled") setActiveKpi("CANCELLED");
    };

    // Filter Logic
    const filteredTenders = ALL_TENDERS.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
      const matchesDept = departmentFilter === "All" || t.department === departmentFilter;
      const matchesClosingSoon = !closingSoonOnly || isClosingSoon(t);
      return matchesSearch && matchesStatus && matchesCategory && matchesDept && matchesClosingSoon;
    });

    const getCategoryBadgeStyle = (cat) => {
      switch (cat) {
        case "Equipment": return { bg: "#eff6ff", color: "#2563eb" };
        case "Infrastructure": return { bg: "#f0fdf4", color: "#16a34a" };
        case "Electrical": return { bg: "#faf5ff", color: "#9333ea" };
        case "Services": return { bg: "#fff7ed", color: "#ea580c" };
        case "Safety": return { bg: "#fdf2f8", color: "#db2777" };
        case "General": return { bg: "#f1f5f9", color: "#64748b" };
        case "Works": return { bg: "#f0f9ff", color: "#0284c7" };
        default: return { bg: "#f1f5f9", color: "#64748b" };
      }
    };

    const getStatusBadgeStyle = (status) => {
      switch (status) {
        case "Active": return { bg: "#dcfce7", color: "#15803d" };
        case "Closed": return { bg: "#f1f5f9", color: "#475569" };
        case "Cancelled": return { bg: "#fee2e2", color: "#dc2626" };
        default: return { bg: "#f1f5f9", color: "#64748b" };
      }
    };

    // If user clicked on a tender to view bidders
    if (selectedTenderForBidders) {
      const appliedBidders = INITIAL_BIDDERS_LIST.filter(
        (b) => b.tender === selectedTenderForBidders.id || b.tender === selectedTenderForBidders.title
      );

      return (
        <div className="section-panel" style={{ padding: "30px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <button
                className="secondary-action-btn"
                onClick={() => setSelectedTenderForBidders(null)}
                style={{ height: "34px", padding: "0 14px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}
              >
                ← Back to All Tenders
              </button>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "1.5rem", color: "#0f172a" }}>Applied Bidders: {selectedTenderForBidders.title}</h2>
              <p className="subtitle" style={{ margin: 0, color: "#64748b" }}>
                Tender Ref: <strong style={{ color: "#0284c7" }}>{selectedTenderForBidders.id}</strong> | Dept: <strong>{selectedTenderForBidders.department}</strong>
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc", textAlign: "left", color: "#64748b", textTransform: "uppercase", fontSize: "0.72rem" }}>
                  <th style={{ padding: "12px" }}>Bidder Name</th>
                  <th style={{ padding: "12px" }}>Submitted Documents</th>
                  <th style={{ padding: "12px" }}>Compliance Rating</th>
                  <th style={{ padding: "12px" }}>Risk Rating</th>
                  <th style={{ padding: "12px" }}>Verification Status</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appliedBidders.map(bidder => (
                  <tr key={bidder.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 12px", fontWeight: 700, color: "#0f172a" }}>{bidder.name}</td>
                    <td style={{ padding: "14px 12px", color: "#64748b" }}>{bidder.documents}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <strong style={{ color: bidder.compliance >= 90 ? "#16a34a" : bidder.compliance >= 70 ? "#d97706" : "#dc2626" }}>
                        {bidder.compliance}%
                      </strong>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: bidder.risk === "LOW" ? "#dcfce7" : bidder.risk === "MEDIUM" ? "#fef3c7" : "#fee2e2", color: bidder.risk === "LOW" ? "#15803d" : bidder.risk === "MEDIUM" ? "#b45309" : "#b91c1c" }}>
                        {bidder.risk}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: bidder.verification === "Verified" ? "#dcfce7" : "#fff7ed", color: bidder.verification === "Verified" ? "#15803d" : "#c2410c" }}>
                        {bidder.verification}
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelectedVerificationBidder(bidder);
                          setActiveSection("verification");
                        }}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        Inspect & Verify Bid →
                      </button>
                    </td>
                  </tr>
                ))}
                {appliedBidders.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No bidder applications found for this tender.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* PAGE HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Tender Management</h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Create, manage and monitor all procurement tenders</p>
          </div>
          <button
            onClick={() => setActiveSection("createTender")}
            style={{ background: "#1d4ed8", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 2px 4px rgba(29,78,216,0.2)" }}
          >
            <Plus size={16} /> Create New Tender
          </button>
        </div>

        {/* ROW 1: TOP 5 SUMMARY KPI CARDS (CLICKABLE FILTERS) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
          {/* Card 1: Total Tenders */}
          <div
            onClick={() => handleKpiFilter("ALL")}
            style={{
              background: activeKpi === "ALL" ? "#f8fafc" : "#ffffff",
              border: activeKpi === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "ALL" ? "0 4px 12px rgba(37,99,235,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeKpi === "ALL" ? "#2563eb" : "#64748b", display: "block" }}>Total Tenders</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{totalCount}</h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>All time</span>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <FileText size={20} />
            </div>
          </div>

          {/* Card 2: Active Tenders */}
          <div
            onClick={() => handleKpiFilter("ACTIVE")}
            style={{
              background: activeKpi === "ACTIVE" ? "#f0fdf4" : "#ffffff",
              border: activeKpi === "ACTIVE" ? "2px solid #16a34a" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "ACTIVE" ? "0 4px 12px rgba(22,163,74,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeKpi === "ACTIVE" ? "#16a34a" : "#64748b", display: "block" }}>Active Tenders</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{activeCount}</h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Currently open</span>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Calendar size={20} />
            </div>
          </div>

          {/* Card 3: Closing Soon */}
          <div
            onClick={() => handleKpiFilter("CLOSING_SOON")}
            style={{
              background: activeKpi === "CLOSING_SOON" ? "#fff7ed" : "#ffffff",
              border: activeKpi === "CLOSING_SOON" ? "2px solid #ea580c" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "CLOSING_SOON" ? "0 4px 12px rgba(234,88,12,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeKpi === "CLOSING_SOON" ? "#ea580c" : "#64748b", display: "block" }}>Closing Soon</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{closingSoonCount}</h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Within 7 days</span>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <Clock3 size={20} />
            </div>
          </div>

          {/* Card 4: Closed Tenders */}
          <div
            onClick={() => handleKpiFilter("CLOSED")}
            style={{
              background: activeKpi === "CLOSED" ? "#faf5ff" : "#ffffff",
              border: activeKpi === "CLOSED" ? "2px solid #9333ea" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "CLOSED" ? "0 4px 12px rgba(147,51,234,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeKpi === "CLOSED" ? "#9333ea" : "#64748b", display: "block" }}>Closed Tenders</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{closedCount}</h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Completed</span>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea" }}>
              <CheckSquare size={20} />
            </div>
          </div>

          {/* Card 5: Cancelled Tenders */}
          <div
            onClick={() => handleKpiFilter("CANCELLED")}
            style={{
              background: activeKpi === "CANCELLED" ? "#fef2f2" : "#ffffff",
              border: activeKpi === "CANCELLED" ? "2px solid #dc2626" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px 20px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "CANCELLED" ? "0 4px 12px rgba(220,38,38,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeKpi === "CANCELLED" ? "#dc2626" : "#64748b", display: "block" }}>Cancelled Tenders</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{cancelledCount}</h2>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Cancelled</span>
            </div>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
              <XCircle size={20} />
            </div>
          </div>
        </div>

        {/* ROW 2: SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-end", flexWrap: "wrap" }}>

          {/* Search Box */}
          <div style={{ flexGrow: 2, minWidth: "220px" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search tender ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none" }}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusDropdownChange(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: "140px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Categories</option>
              <option value="Equipment">Equipment</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Electrical">Electrical</option>
              <option value="Services">Services</option>
              <option value="Safety">Safety</option>
              <option value="General">General</option>
              <option value="Works">Works</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div style={{ minWidth: "140px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Departments</option>
              <option value="Projects">Projects</option>
              <option value="Engineering">Engineering</option>
              <option value="Operations">Operations</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Date Picker Input */}
          <div style={{ minWidth: "160px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Closing Date</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Select date range"
                style={{ width: "100%", padding: "9px 36px 9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none" }}
              />
              <Calendar size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#2563eb", borderRadius: "8px", padding: "9px 14px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            >
              <Filter size={15} /> Filters
            </button>
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); setCategoryFilter("All"); setDepartmentFilter("All"); setClosingSoonOnly(false); setActiveKpi("ALL"); }}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", padding: "9px 6px" }}
            >
              Reset
            </button>
          </div>

        </div>

        {/* ROW 3: DATA TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.72rem", fontWeight: 800, textAlign: "left" }}>
                  <th style={{ padding: "14px 16px" }}>Tender ID</th>
                  <th style={{ padding: "14px 16px" }}>Tender Title</th>
                  <th style={{ padding: "14px 16px" }}>Category</th>
                  <th style={{ padding: "14px 16px" }}>Department</th>
                  <th style={{ padding: "14px 16px" }}>Published Date</th>
                  <th style={{ padding: "14px 16px" }}>Closing Date</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Bidders</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Pending Verification</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenders.map((row) => {
                  const catStyle = getCategoryBadgeStyle(row.category);
                  const statusStyle = getStatusBadgeStyle(row.status);
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{row.id}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#1e293b" }}>{row.title}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: catStyle.bg, color: catStyle.color, padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>{row.department}</td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>{row.publishedDate}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#334155", fontWeight: 600 }}>{row.closingDate}</div>
                        {row.daysLeft && (
                          <div style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700 }}>{row.daysLeft}</div>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>{row.bidders}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: row.pending > 0 ? "#dc2626" : "#64748b" }}>{row.pending}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "4px 12px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            title="View Bidders"
                            onClick={() => setSelectedTenderForBidders(row)}
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Edit Tender"
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title="More Options"
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ROW 4: PAGINATION FOOTER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.8rem", color: "#64748b" }}>
            <span>Showing 1 to {filteredTenders.length} of {ALL_TENDERS.length} tenders</span>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronsLeft size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "#1d4ed8", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>1</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>2</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>3</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronsRight size={14} /></button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Modern premium Bidder list view component - Matching exact reference design
  const BiddersView = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [riskFilter, setRiskFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [verificationFilter, setVerificationFilter] = useState("All");
    const [activeKpi, setActiveKpi] = useState("ALL");
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const ALL_BIDDERS = [
      {
        id: "BIDDER-0001",
        initials: "AI",
        name: "ABC Industries Pvt Ltd",
        status: "Verified",
        statusBadgeBg: "#dcfce7",
        statusBadgeColor: "#15803d",
        pan: "AABCA1234A",
        gstin: "24AABCA1234A1Z5",
        type: "Private Limited",
        phone: "+91 98765 43210",
        email: "info@abcindustries.com",
        location: "Ahmedabad, Gujarat",
        complianceScore: 92,
        ratingText: "Excellent",
        scoreColor: "#16a34a",
        riskLevel: "Low Risk",
        riskBg: "#f0fdf4",
        riskColor: "#15803d",
        verificationStatus: "Verified",
        verificationBg: "#dcfce7",
        verificationColor: "#15803d",
        verificationDate: "20 May 2025",
        activeTenders: 5,
        isNew: false
      },
      {
        id: "BIDDER-0002",
        initials: "XE",
        name: "XYZ Engineering Ltd",
        status: "Active",
        statusBadgeBg: "#eff6ff",
        statusBadgeColor: "#2563eb",
        pan: "AAACX2345B",
        gstin: "2AAACX2345B1ZB",
        type: "Public Limited",
        phone: "+91 97654 32109",
        email: "contact@xyzengineering.com",
        location: "Vadodara, Gujarat",
        complianceScore: 78,
        ratingText: "Good",
        scoreColor: "#2563eb",
        riskLevel: "Medium Risk",
        riskBg: "#fff7ed",
        riskColor: "#ea580c",
        verificationStatus: "Under Review",
        verificationBg: "#eff6ff",
        verificationColor: "#2563eb",
        verificationDate: "19 May 2025",
        activeTenders: 3,
        isNew: true
      },
      {
        id: "BIDDER-0003",
        initials: "GS",
        name: "Global Suppliers",
        status: "Active",
        statusBadgeBg: "#eff6ff",
        statusBadgeColor: "#2563eb",
        pan: "AAACG3456C",
        gstin: "24AAACG3456C1Z9",
        type: "Partnership",
        phone: "+91 98980 11223",
        email: "sales@globalsuppliers.com",
        location: "Mumbai, Maharashtra",
        complianceScore: 56,
        ratingText: "Average",
        scoreColor: "#ea580c",
        riskLevel: "High Risk",
        riskBg: "#fef2f2",
        riskColor: "#dc2626",
        verificationStatus: "Issues Found",
        verificationBg: "#fef2f2",
        verificationColor: "#dc2626",
        verificationDate: "18 May 2025",
        activeTenders: 2,
        isNew: false
      },
      {
        id: "BIDDER-0004",
        initials: "PT",
        name: "Precision Tools Pvt Ltd",
        status: "Verified",
        statusBadgeBg: "#dcfce7",
        statusBadgeColor: "#15803d",
        pan: "AABCP4567D",
        gstin: "24AABCP4567D1Z3",
        type: "Private Limited",
        phone: "+91 98250 99887",
        email: "info@precisiontools.in",
        location: "Pune, Maharashtra",
        complianceScore: 88,
        ratingText: "Very Good",
        scoreColor: "#16a34a",
        riskLevel: "Low Risk",
        riskBg: "#f0fdf4",
        riskColor: "#15803d",
        verificationStatus: "Verified",
        verificationBg: "#dcfce7",
        verificationColor: "#15803d",
        verificationDate: "17 May 2025",
        activeTenders: 4,
        isNew: true
      },
      {
        id: "BIDDER-0005",
        initials: "SE",
        name: "Shree Enterprises",
        status: "Active",
        statusBadgeBg: "#eff6ff",
        statusBadgeColor: "#2563eb",
        pan: "AAACS5678E",
        gstin: "24AAACS5678E1Z1",
        type: "Proprietorship",
        phone: "+91 97123 45678",
        email: "shreeenterprises@gmail.com",
        location: "Rajkot, Gujarat",
        complianceScore: 35,
        ratingText: "Poor",
        scoreColor: "#dc2626",
        riskLevel: "High Risk",
        riskBg: "#fef2f2",
        riskColor: "#dc2626",
        verificationStatus: "Documents Pending",
        verificationBg: "#fff7ed",
        verificationColor: "#c2410c",
        verificationDate: "16 May 2025",
        activeTenders: 1,
        isNew: true
      },
      {
        id: "BIDDER-0006",
        initials: "NI",
        name: "Nirman Infra Pvt Ltd",
        status: "Inactive",
        statusBadgeBg: "#f1f5f9",
        statusBadgeColor: "#64748b",
        pan: "AABCN6789F",
        gstin: "24AABCN6789F1Z7",
        type: "Private Limited",
        phone: "+91 99090 90909",
        email: "contact@nirmaninfra.com",
        location: "Surat, Gujarat",
        complianceScore: null,
        ratingText: "Not Available",
        scoreColor: "#94a3b8",
        riskLevel: "-",
        riskBg: "#f1f5f9",
        riskColor: "#64748b",
        verificationStatus: "Not Verified",
        verificationBg: "#f1f5f9",
        verificationColor: "#64748b",
        verificationDate: "",
        activeTenders: 0,
        isNew: false
      },
      {
        id: "BIDDER-0007",
        initials: "PM",
        name: "Prime Manufacturers",
        status: "Blacklisted",
        statusBadgeBg: "#fee2e2",
        statusBadgeColor: "#dc2626",
        pan: "AAACP7890G",
        gstin: "24AAACP7890G1Z6",
        type: "Private Limited",
        phone: "+91 97654 11122",
        email: "info@primemanufacturers.com",
        location: "Delhi",
        complianceScore: 20,
        ratingText: "Very Poor",
        scoreColor: "#dc2626",
        riskLevel: "High Risk",
        riskBg: "#fef2f2",
        riskColor: "#dc2626",
        verificationStatus: "Blacklisted",
        verificationBg: "#fee2e2",
        verificationColor: "#dc2626",
        verificationDate: "10 May 2025",
        activeTenders: 0,
        isNew: false
      },
      {
        id: "BIDDER-0008",
        initials: "TS",
        name: "TechVision Solutions Ltd",
        status: "Verified",
        statusBadgeBg: "#dcfce7",
        statusBadgeColor: "#15803d",
        pan: "AABCT8901H",
        gstin: "27AABCT8901H1Z2",
        type: "Public Limited",
        phone: "+91 98111 22334",
        email: "contact@techvision.in",
        location: "Bengaluru, Karnataka",
        complianceScore: 95,
        ratingText: "Excellent",
        scoreColor: "#16a34a",
        riskLevel: "Low Risk",
        riskBg: "#f0fdf4",
        riskColor: "#15803d",
        verificationStatus: "Verified",
        verificationBg: "#dcfce7",
        verificationColor: "#15803d",
        verificationDate: "22 May 2025",
        activeTenders: 6,
        isNew: false
      },
      {
        id: "BIDDER-0009",
        initials: "AI",
        name: "Apex Infrastructure Corp",
        status: "Active",
        statusBadgeBg: "#eff6ff",
        statusBadgeColor: "#2563eb",
        pan: "AAACA9012I",
        gstin: "07AAACA9012I1Z4",
        type: "Private Limited",
        phone: "+91 98333 44556",
        email: "info@apexinfra.com",
        location: "Gurugram, Haryana",
        complianceScore: 72,
        ratingText: "Good",
        scoreColor: "#2563eb",
        riskLevel: "Medium Risk",
        riskBg: "#fff7ed",
        riskColor: "#ea580c",
        verificationStatus: "Under Review",
        verificationBg: "#eff6ff",
        verificationColor: "#2563eb",
        verificationDate: "21 May 2025",
        activeTenders: 2,
        isNew: true
      },
      {
        id: "BIDDER-0010",
        initials: "RT",
        name: "Royal Trading Co",
        status: "Blacklisted",
        statusBadgeBg: "#fee2e2",
        statusBadgeColor: "#dc2626",
        pan: "AAACR0123J",
        gstin: "19AAACR0123J1Z8",
        type: "Partnership",
        phone: "+91 98444 55667",
        email: "sales@royaltrading.co.in",
        location: "Kolkata, West Bengal",
        complianceScore: 18,
        ratingText: "Very Poor",
        scoreColor: "#dc2626",
        riskLevel: "High Risk",
        riskBg: "#fef2f2",
        riskColor: "#dc2626",
        verificationStatus: "Blacklisted",
        verificationBg: "#fee2e2",
        verificationColor: "#dc2626",
        verificationDate: "05 May 2025",
        activeTenders: 0,
        isNew: false
      }
    ];

    // Dynamic KPI Calculations
    const totalCount = ALL_BIDDERS.length;
    const activeCount = ALL_BIDDERS.filter(b => b.status === "Active" || b.status === "Verified").length;
    const newCount = ALL_BIDDERS.filter(b => b.isNew).length;
    const highRiskCount = ALL_BIDDERS.filter(b => b.riskLevel === "High Risk").length;
    const verifiedCount = ALL_BIDDERS.filter(b => b.verificationStatus === "Verified").length;
    const blacklistedCount = ALL_BIDDERS.filter(b => b.status === "Blacklisted" || b.verificationStatus === "Blacklisted").length;

    const formatNum = (n) => (n < 10 ? `0${n}` : `${n}`);

    const handleKpiFilter = (type) => {
      setActiveKpi(type);
      if (type === "ALL") {
        setStatusFilter("All");
        setRiskFilter("All");
        setVerificationFilter("All");
      } else if (type === "ACTIVE") {
        setStatusFilter("Active");
        setRiskFilter("All");
        setVerificationFilter("All");
      } else if (type === "NEW") {
        setStatusFilter("All");
        setRiskFilter("All");
        setVerificationFilter("All");
      } else if (type === "HIGH_RISK") {
        setStatusFilter("All");
        setRiskFilter("High Risk");
        setVerificationFilter("All");
      } else if (type === "VERIFIED") {
        setStatusFilter("All");
        setRiskFilter("All");
        setVerificationFilter("Verified");
      } else if (type === "BLACKLISTED") {
        setStatusFilter("Blacklisted");
        setRiskFilter("All");
        setVerificationFilter("All");
      }
    };

    // Filter Logic
    const filteredBidders = ALL_BIDDERS.filter(b => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.pan.toLowerCase().includes(q) ||
        b.gstin.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "All" || b.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesRisk = riskFilter === "All" || b.riskLevel.toLowerCase() === riskFilter.toLowerCase();
      const matchesType = typeFilter === "All" || b.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesVerification = verificationFilter === "All" || b.verificationStatus.toLowerCase() === verificationFilter.toLowerCase();
      const matchesNewKpi = activeKpi !== "NEW" || b.isNew;

      return matchesSearch && matchesStatus && matchesRisk && matchesType && matchesVerification && matchesNewKpi;
    });

    const resetFilters = () => {
      setSearchQuery("");
      setStatusFilter("All");
      setRiskFilter("All");
      setTypeFilter("All");
      setVerificationFilter("All");
      setActiveKpi("ALL");
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* PAGE HEADER */}
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Bidders</h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>View and manage all registered and participating bidders across tenders</p>
        </div>

        {/* ROW 1: TOP 6 SUMMARY KPI CARDS (CLICKABLE FILTERS) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
          {/* Card 1: Total Bidders */}
          <div
            onClick={() => handleKpiFilter("ALL")}
            style={{
              background: activeKpi === "ALL" ? "#f8fafc" : "#ffffff",
              border: activeKpi === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "ALL" ? "0 4px 12px rgba(37,99,235,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "ALL" ? "#2563eb" : "#64748b", display: "block" }}>Total Bidders</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(totalCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>All time registered</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Users size={18} />
            </div>
          </div>

          {/* Card 2: Active Bidders */}
          <div
            onClick={() => handleKpiFilter("ACTIVE")}
            style={{
              background: activeKpi === "ACTIVE" ? "#f0fdf4" : "#ffffff",
              border: activeKpi === "ACTIVE" ? "2px solid #16a34a" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "ACTIVE" ? "0 4px 12px rgba(22,163,74,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "ACTIVE" ? "#16a34a" : "#64748b", display: "block" }}>Active Bidders</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(activeCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Participating in active tenders</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <UserCheck size={18} />
            </div>
          </div>

          {/* Card 3: New This Month */}
          <div
            onClick={() => handleKpiFilter("NEW")}
            style={{
              background: activeKpi === "NEW" ? "#faf5ff" : "#ffffff",
              border: activeKpi === "NEW" ? "2px solid #9333ea" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "NEW" ? "0 4px 12px rgba(147,51,234,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "NEW" ? "#9333ea" : "#64748b", display: "block" }}>New This Month</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(newCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Newly registered bidders</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea" }}>
              <UserPlus size={18} />
            </div>
          </div>

          {/* Card 4: High Risk Bidders */}
          <div
            onClick={() => handleKpiFilter("HIGH_RISK")}
            style={{
              background: activeKpi === "HIGH_RISK" ? "#fef2f2" : "#ffffff",
              border: activeKpi === "HIGH_RISK" ? "2px solid #dc2626" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "HIGH_RISK" ? "0 4px 12px rgba(220,38,38,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "HIGH_RISK" ? "#dc2626" : "#64748b", display: "block" }}>High Risk Bidders</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(highRiskCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Requires attention</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
              <ShieldAlert size={18} />
            </div>
          </div>

          {/* Card 5: Verified Bidders */}
          <div
            onClick={() => handleKpiFilter("VERIFIED")}
            style={{
              background: activeKpi === "VERIFIED" ? "#f0fdf4" : "#ffffff",
              border: activeKpi === "VERIFIED" ? "2px solid #16a34a" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "VERIFIED" ? "0 4px 12px rgba(22,163,74,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "VERIFIED" ? "#16a34a" : "#64748b", display: "block" }}>Verified Bidders</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(verifiedCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Successfully verified</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Award size={18} />
            </div>
          </div>

          {/* Card 6: Blacklisted / Debarred */}
          <div
            onClick={() => handleKpiFilter("BLACKLISTED")}
            style={{
              background: activeKpi === "BLACKLISTED" ? "#f8fafc" : "#ffffff",
              border: activeKpi === "BLACKLISTED" ? "2px solid #475569" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "BLACKLISTED" ? "0 4px 12px rgba(71,85,105,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "BLACKLISTED" ? "#475569" : "#64748b", display: "block" }}>Blacklisted/ Debarred</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{formatNum(blacklistedCount)}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Not eligible to participate</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <UserX size={18} />
            </div>
          </div>
        </div>

        {/* ROW 2: SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "flex-end", flexWrap: "wrap" }}>

          {/* Search Input */}
          <div style={{ flexGrow: 2, minWidth: "220px" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search bidder name, ID, PAN, GST..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none" }}
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Verified">Verified</option>
              <option value="Inactive">Inactive</option>
              <option value="Blacklisted">Blacklisted</option>
            </select>
          </div>

          {/* Risk Level Dropdown */}
          <div style={{ minWidth: "140px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          {/* Registration Type Dropdown */}
          <div style={{ minWidth: "140px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Registration Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Types</option>
              <option value="Private Limited">Private Limited</option>
              <option value="Public Limited">Public Limited</option>
              <option value="Partnership">Partnership</option>
              <option value="Proprietorship">Proprietorship</option>
            </select>
          </div>

          {/* Verification Status Dropdown */}
          <div style={{ minWidth: "150px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Verification Status</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Status</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Issues Found">Issues Found</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Not Verified">Not Verified</option>
              <option value="Blacklisted">Blacklisted</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#2563eb", borderRadius: "8px", padding: "9px 14px", fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            >
              <Filter size={15} /> Filters
            </button>
            <button
              onClick={resetFilters}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", padding: "9px 6px" }}
            >
              Reset
            </button>
          </div>

        </div>

        {/* ROW 3: DATA TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.72rem", fontWeight: 800, textAlign: "left" }}>
                  <th style={{ padding: "14px 16px" }}>Bidder Details</th>
                  <th style={{ padding: "14px 16px" }}>Registration Details</th>
                  <th style={{ padding: "14px 16px" }}>Contact Details</th>
                  <th style={{ padding: "14px 16px" }}>Compliance Score</th>
                  <th style={{ padding: "14px 16px" }}>Risk Level</th>
                  <th style={{ padding: "14px 16px" }}>Verification Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Active Tenders</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBidders.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                    {/* Column 1: Bidder Details */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#334155", fontSize: "0.82rem", flexShrink: 0 }}>
                          {b.initials}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: "#0f172a", display: "block", fontSize: "0.85rem" }}>{b.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>{b.id}</span>
                            <span style={{ padding: "1px 6px", borderRadius: "10px", fontSize: "0.65rem", fontWeight: 700, background: b.statusBadgeBg, color: b.statusBadgeColor }}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Registration Details */}
                    <td style={{ padding: "14px 16px", fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
                      <div>PAN: <strong>{b.pan}</strong></div>
                      <div>GSTIN: <span>{b.gstin}</span></div>
                      <div style={{ color: "#64748b" }}>Type: {b.type}</div>
                    </td>

                    {/* Column 3: Contact Details */}
                    <td style={{ padding: "14px 16px", fontSize: "0.75rem", color: "#475569" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Phone size={12} style={{ color: "#64748b" }} /> {b.phone}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Mail size={12} style={{ color: "#64748b" }} /> {b.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#64748b" }}>
                          <MapPin size={12} style={{ color: "#64748b" }} /> {b.location}
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Compliance Score */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ width: "130px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{b.complianceScore !== null ? `${b.complianceScore}%` : "—"}</strong>
                        </div>
                        {b.complianceScore !== null ? (
                          <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginBottom: "4px" }}>
                            <div style={{ width: `${b.complianceScore}%`, height: "100%", background: b.scoreColor, borderRadius: "4px" }}></div>
                          </div>
                        ) : (
                          <div style={{ width: "100%", height: "3px", background: "#cbd5e1", borderRadius: "4px", marginBottom: "4px" }}></div>
                        )}
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: b.scoreColor }}>{b.ratingText}</span>
                      </div>
                    </td>

                    {/* Column 5: Risk Level */}
                    <td style={{ padding: "14px 16px" }}>
                      {b.riskLevel !== "-" ? (
                        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: b.riskBg, color: b.riskColor }}>
                          {b.riskLevel}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>

                    {/* Column 6: Verification Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700, background: b.verificationBg, color: b.verificationColor, display: "inline-block" }}>
                        {b.verificationStatus}
                      </span>
                      {b.verificationDate && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>{b.verificationDate}</div>
                      )}
                    </td>

                    {/* Column 7: Active Tenders */}
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>
                      {b.activeTenders}
                    </td>

                    {/* Column 8: Actions */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          title="View Details"
                          onClick={() => { setSelectedVerificationBidder(b); setActiveSection("verification"); }}
                          style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          title="Inspect Documents"
                          onClick={() => { setSelectedVerificationBidder(b); setActiveSection("verification"); }}
                          style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          title="More Options"
                          style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
                {filteredBidders.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      No bidder records found matching active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ROW 4: PAGINATION FOOTER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#ffffff", fontSize: "0.8rem", color: "#64748b" }}>
            <span>Showing {filteredBidders.length > 0 ? 1 : 0} to {filteredBidders.length} of {ALL_BIDDERS.length} bidders</span>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff", outline: "none", cursor: "pointer" }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronsLeft size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "none", background: "#1d4ed8", color: "#ffffff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>1</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>2</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>3</button>
                <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>25</button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={14} /></button>
                <button style={{ width: "28px", height: "28px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronsRight size={14} /></button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Advanced AI Bid Verification Dashboard View component - Fully interactive matching user specs
  const VerificationView = () => {
    const [activeTab, setActiveTab] = useState("documents");
    const [officerDecision, setOfficerDecision] = useState("qualified");

    // Auth Modal state
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [officerPassword, setOfficerPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isDecisionLocked, setIsDecisionLocked] = useState(false);
    const [lockedRecordInfo, setLockedRecordInfo] = useState(null);

    // Dynamic document verification map state
    const [verifiedDocMap, setVerifiedDocMap] = useState({});

    // Document preview modal state
    const [previewDocument, setPreviewDocument] = useState(null);

    // Dynamic Bidder data fallback from selectedVerificationBidder or default reference data
    const bidderName = selectedVerificationBidder?.name || "ABC Industries Pvt Ltd";
    const bidderLocation = selectedVerificationBidder?.location || "Ahmedabad, Gujarat";
    const bidderStatus = selectedVerificationBidder?.verificationStatus || "Verified";
    const bidderPan = selectedVerificationBidder?.pan || "AABCA1234A";
    const bidderGstin = selectedVerificationBidder?.gstin || "24AABCA1234A1Z5";
    const bidderType = selectedVerificationBidder?.type || "Private Limited";
    const bidderPhone = selectedVerificationBidder?.phone || "+91 98765 43210";
    const bidderEmail = selectedVerificationBidder?.email || "info@abcindustries.com";
    const bidderScore = selectedVerificationBidder?.complianceScore !== undefined && selectedVerificationBidder?.complianceScore !== null ? selectedVerificationBidder.complianceScore : 82;
    const bidderRisk = selectedVerificationBidder?.riskLevel || "Medium Risk";

    const initialSubmittedDocuments = [
      { id: 1, type: "PAN Card", number: bidderPan, issuedBy: "Income Tax Dept.", issueDate: "12 May 2010", expiryDate: "—", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 2, type: "GST Registration", number: bidderGstin, issuedBy: "GST Dept.", issueDate: "18 Jun 2018", expiryDate: "—", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 3, type: "GST Return (Latest)", number: "GSTR3B-042025", issuedBy: "GST Portal", issueDate: "20 Apr 2025", expiryDate: "—", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 4, type: "Udyam / MSME", number: "UDYAM-GJ-01-1234567", issuedBy: "MSME", issueDate: "25 Jan 2024", expiryDate: "24 Jan 2027", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 5, type: "Income Tax Return", number: "ITR-AY2425-98AB", issuedBy: "Income Tax Dept.", issueDate: "30 Jul 2024", expiryDate: "—", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 6, type: "EPFO Compliance", number: "GJ/AHM/1234567", issuedBy: "EPFO", issueDate: "—", expiryDate: "—", status: "Pending", statusBg: "#fff7ed", statusColor: "#ea580c" },
      { id: 7, type: "ESIC Compliance", number: "11/11/123456/000", issuedBy: "ESIC", issueDate: "—", expiryDate: "—", status: "Pending", statusBg: "#fff7ed", statusColor: "#ea580c" },
      { id: 8, type: "Bank Solvency Certificate", number: "BSC/AXIS/0425/001", issuedBy: "Axis Bank", issueDate: "28 Apr 2025", expiryDate: "27 Jul 2025", status: "Issues Found", statusBg: "#fef2f2", statusColor: "#dc2626" },
      { id: 9, type: "OEM Authorization", number: "OEM/2025/0987", issuedBy: "ABC Manufacturing", issueDate: "01 Jan 2025", expiryDate: "31 Dec 2025", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" },
      { id: 10, type: "Bid Security / EMD", number: "EMD-9876543210", issuedBy: "ICICI Bank", issueDate: "15 May 2025", expiryDate: "15 Aug 2025", status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" }
    ];

    const submittedDocuments = initialSubmittedDocuments.map((doc) => {
      if (verifiedDocMap[doc.id]) {
        return { ...doc, status: "Verified", statusBg: "#dcfce7", statusColor: "#15803d" };
      }
      return doc;
    });

    const verifiedCount = submittedDocuments.filter(d => d.status === "Verified").length;
    const pendingCount = submittedDocuments.filter(d => d.status === "Pending").length;
    const issuesCount = submittedDocuments.filter(d => d.status === "Issues Found").length;

    const handleVerifySingleDoc = (docId) => {
      setVerifiedDocMap(prev => ({ ...prev, [docId]: true }));
    };

    const handleVerifyAllDocs = () => {
      const allVerified = {};
      initialSubmittedDocuments.forEach(doc => {
        allVerified[doc.id] = true;
      });
      setVerifiedDocMap(allVerified);
    };

    const complianceChecks = [
      { id: "CHK-01", name: "PAN Verification & Income Tax API Check", category: "Statutory", status: "Passed", confidence: "99%", source: "CBDT Direct API" },
      { id: "CHK-02", name: "GST Active Status & Return Filing History", category: "Statutory", status: "Passed", confidence: "98%", source: "GSTN Portal API" },
      { id: "CHK-03", name: "MSME Udyam Micro/Small Unit Validation", category: "Statutory", status: "Passed", confidence: "97%", source: "Udyam Portal" },
      { id: "CHK-04", name: "OEM Authorization Letter Entity Name Matching", category: "Technical", status: "Warning", confidence: "82%", source: "AI OCR NLP Match" },
      { id: "CHK-05", name: "Bank Solvency & Financial Credit Worthiness", category: "Financial", status: "Failed", confidence: "68%", source: "Axis Bank Verification" },
      { id: "CHK-06", name: "EPFO Employee Strength & Filing Verification", category: "Statutory", status: "Pending", confidence: "—", source: "EPFO Portal Queue" },
      { id: "CHK-07", name: "ESIC Contribution Regularity Verification", category: "Statutory", status: "Pending", confidence: "—", source: "ESIC Portal Queue" }
    ];

    const handleAuthenticateAndSubmit = (e) => {
      e.preventDefault();
      if (!officerPassword || officerPassword.length < 3) {
        setAuthError("Please enter your Procurement Officer password to authenticate.");
        return;
      }

      const randomHash = "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();
      const timestamp = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

      const record = {
        decision: officerDecision,
        officer: user?.full_name || "Procurement Officer #OFF-9821",
        timestamp: timestamp,
        hash: randomHash
      };

      setLockedRecordInfo(record);
      setIsDecisionLocked(true);
      setShowAuthModal(false);
      setOfficerPassword("");
      setAuthError("");
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#f8fafc", padding: "4px" }}>

        {/* BREADCRUMB & HEADER TOP BAR */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#64748b", marginBottom: "8px" }}>
            <span
              onClick={() => setActiveSection("bidders")}
              style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
            >
              Dashboard
            </span>
            <span>›</span>
            <span
              onClick={() => setActiveSection("bidders")}
              style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
            >
              Tender Management
            </span>
            <span>›</span>
            <span
              onClick={() => setActiveSection("bidders")}
              style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}
            >
              CPCL/2026/001
            </span>
            <span>›</span>
            <strong style={{ color: "#0f172a" }}>Bid Verification</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>Bid Verification</h1>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Review bidder compliance, documents, and AI analysis before making decision</p>
            </div>
            <button
              onClick={() => setActiveSection("bidders")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <ArrowLeft size={14} /> Back to Bidders
            </button>
          </div>
        </div>

        {/* TOP SUMMARY CARDS (6 SUMMARY TILES IN SINGLE ROW) */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", alignItems: "center" }}>

          {/* Tile 1: Tender Details */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Tender Details</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>CPCL/2026/001</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Industrial Equipment Supply</span>
          </div>

          {/* Tile 2: Bid Details */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Bid Details</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>BIDDER-0001</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Submitted on 15 May 2025, 11:24 AM</span>
          </div>

          {/* Tile 3: Bidder */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Bidder</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>{bidderName}</h3>
              <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>● {bidderStatus}</span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{bidderLocation}</span>
          </div>

          {/* Tile 4: Bid Value */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Bid Value</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>₹ 2,48,75,000</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Inclusive of GST)</span>
          </div>

          {/* Tile 5: Compliance Score */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Compliance Score</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ position: "relative", width: "42px", height: "42px" }}>
                <svg width="42" height="42" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeDasharray={`${bidderScore}, 100`} />
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16a34a", display: "block", lineHeight: 1 }}>{bidderScore}%</strong>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a" }}>Good</span>
              </div>
            </div>
          </div>

          {/* Tile 6: Risk Level */}
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "4px" }}>Risk Level</span>
            <span style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700, background: "#fff7ed", color: "#ea580c", display: "inline-block" }}>
              ◆ {bidderRisk}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "2px" }}>Requires Review</span>
          </div>

        </div>

        {/* MAIN 3-COLUMN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 310px", gap: "16px", alignItems: "start" }}>

          {/* LEFT COLUMN: VERIFICATION PROGRESS & BIDDER INFO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Card 1: Verification Progress */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>Verification Progress</h3>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="100" height="100" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray={`${verifiedCount * 10}, 100`} />
                  </svg>
                  <div style={{ position: "absolute", textAlign: "center" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1 }}>{verifiedCount}/10</span>
                    <span style={{ fontSize: "0.62rem", color: "#64748b", lineHeight: 1.1, display: "block" }}>Documents<br />Verified</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#16a34a" }}></span> Verified
                  </span>
                  <strong style={{ color: "#0f172a" }}>{verifiedCount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ea580c" }}></span> Pending
                  </span>
                  <strong style={{ color: "#0f172a" }}>{pendingCount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#dc2626" }}></span> Issues Found
                  </span>
                  <strong style={{ color: "#0f172a" }}>{issuesCount}</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Bidder Information */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>Bidder Information</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>PAN</span>
                  <strong style={{ color: "#0f172a" }}>{bidderPan}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>GSTIN</span>
                  <strong style={{ color: "#0f172a" }}>{bidderGstin}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Udyam</span>
                  <strong style={{ color: "#0f172a" }}>UDYAM-GJ-01-1234567</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Constitution</span>
                  <strong style={{ color: "#0f172a" }}>{bidderType}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Incorporation</span>
                  <strong style={{ color: "#0f172a" }}>12 May 2010</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Email</span>
                  <strong style={{ color: "#0f172a" }}>{bidderEmail}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Mobile</span>
                  <strong style={{ color: "#0f172a" }}>{bidderPhone}</strong>
                </div>
              </div>

              {/* Registered Address */}
              <div style={{ paddingTop: "12px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "6px" }}>Registered Address</span>
                <div style={{ display: "flex", gap: "6px", fontSize: "0.72rem", color: "#475569", lineHeight: 1.4 }}>
                  <MapPin size={14} style={{ color: "#64748b", flexShrink: 0, marginTop: "2px" }} />
                  <span>123, Industrial Area, Phase - IV, GIDC Vatva, Ahmedabad - 382445, Gujarat, India</span>
                </div>
              </div>
            </div>

          </div>

          {/* MIDDLE COLUMN: TABS & DYNAMIC TAB CONTENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* TABS BAR (Updated tabs list per user request) */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#ffffff", padding: "0 16px", borderRadius: "12px 12px 0 0" }}>
              <button
                onClick={() => setActiveTab("documents")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === "documents" ? 700 : 600,
                  color: activeTab === "documents" ? "#2563eb" : "#64748b",
                  borderBottom: activeTab === "documents" ? "2px solid #2563eb" : "2px solid transparent",
                  background: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  cursor: "pointer"
                }}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab("checks")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === "checks" ? 700 : 600,
                  color: activeTab === "checks" ? "#2563eb" : "#64748b",
                  borderBottom: activeTab === "checks" ? "2px solid #2563eb" : "2px solid transparent",
                  background: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  cursor: "pointer"
                }}
              >
                Compliance Checks
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === "analysis" ? 700 : 600,
                  color: activeTab === "analysis" ? "#2563eb" : "#64748b",
                  borderBottom: activeTab === "analysis" ? "2px solid #2563eb" : "2px solid transparent",
                  background: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  cursor: "pointer"
                }}
              >
                AI Analysis
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === "audit" ? 700 : 600,
                  color: activeTab === "audit" ? "#2563eb" : "#64748b",
                  borderBottom: activeTab === "audit" ? "2px solid #2563eb" : "2px solid transparent",
                  background: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  cursor: "pointer"
                }}
              >
                Audit Trail
              </button>
              <button
                onClick={() => setActiveTab("document_verification")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === "document_verification" ? 700 : 600,
                  color: activeTab === "document_verification" ? "#2563eb" : "#64748b",
                  borderBottom: activeTab === "document_verification" ? "2px solid #2563eb" : "2px solid transparent",
                  background: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  borderTop: "none",
                  cursor: "pointer"
                }}
              >
                Document Verification
              </button>
            </div>

            {/* TAB CONTENT 1: DOCUMENTS */}
            {activeTab === "documents" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Submitted Documents</h3>
                  <button style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Maximize2 size={12} /> Expand All
                  </button>
                </div>

                {/* TABLE */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", background: "#f8fafc" }}>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Document Type</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Document Number</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Issued By</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Issue Date</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Expiry Date</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedDocuments.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: "1px solid #f1f5f9", background: doc.status === "Issues Found" ? "#fff5f5" : "transparent" }}>
                          <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <FileText size={14} style={{ color: "#2563eb" }} />
                              <span>{doc.type}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#334155", fontFamily: "monospace" }}>{doc.number}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{doc.issuedBy}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{doc.issueDate}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b" }}>{doc.expiryDate}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 700, background: doc.statusBg, color: doc.statusColor, display: "inline-block" }}>
                              {doc.status}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                onClick={() => setPreviewDocument(doc)}
                                title="View Document Inspection"
                                style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer" }}
                              >
                                <Eye size={14} />
                              </button>
                              <button title="Download File Payload" style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer" }}>
                                <Download size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* STATUS ALERT AT BOTTOM OF TABLE */}
                {issuesCount > 0 || pendingCount > 0 ? (
                  <div style={{ marginTop: "14px", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.76rem", color: "#d97706" }}>
                    <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span>{issuesCount > 0 ? `${issuesCount} document(s) have issues requiring officer review.` : `${pendingCount} document(s) are pending verification.`}</span>
                  </div>
                ) : (
                  <div style={{ marginTop: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.76rem", color: "#15803d" }}>
                    <CheckCircle2 size={16} style={{ color: "#15803d", flexShrink: 0 }} />
                    <span>All 10 documents are fully verified and approved by Procurement Officer!</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: COMPLIANCE CHECKS */}
            {activeTab === "checks" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>Compliance Verification Checks Breakdown</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {complianceChecks.map((chk) => (
                    <div key={chk.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{chk.id} • {chk.category}</span>
                        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", margin: "2px 0 0 0" }}>{chk.name}</h4>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Source: {chk.source}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: chk.status === "Passed" ? "#dcfce7" : chk.status === "Warning" ? "#fff7ed" : chk.status === "Failed" ? "#fef2f2" : "#eff6ff",
                          color: chk.status === "Passed" ? "#15803d" : chk.status === "Warning" ? "#c2410c" : chk.status === "Failed" ? "#b91c1c" : "#1d4ed8",
                          display: "inline-block"
                        }}>
                          {chk.status}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "4px" }}>Confidence: {chk.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: AI ANALYSIS */}
            {activeTab === "analysis" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Sparkles size={18} style={{ color: "#4f46e5" }} />
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>AI Extraction & Verification Insights</h3>
                </div>

                <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "8px", padding: "14px", marginBottom: "14px", fontSize: "0.82rem", color: "#1e40af" }}>
                  <strong>Automated Neural NLP Findings:</strong> AI scanned 10 uploaded PDF artifacts against Government Database Endpoints (GSTN, CBDT, MSME, EPFO). Financial standing score is 82%.
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Field Parameter</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Extracted Document Value</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Government Portal Record</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Match Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>Legal Entity Name</td>
                      <td style={{ padding: "8px 10px" }}>{bidderName}</td>
                      <td style={{ padding: "8px 10px" }}>{bidderName}</td>
                      <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: 700 }}>100% Match</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>GSTIN Status</td>
                      <td style={{ padding: "8px 10px" }}>{bidderGstin} (Active)</td>
                      <td style={{ padding: "8px 10px" }}>{bidderGstin} (Active)</td>
                      <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: 700 }}>VERIFIED</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>OEM Auth Entity</td>
                      <td style={{ padding: "8px 10px", background: "#fff7ed", color: "#c2410c" }}>ABC Manufacturing Corp</td>
                      <td style={{ padding: "8px 10px" }}>ABC Manufacturing Pvt. Ltd.</td>
                      <td style={{ padding: "8px 10px", color: "#ea580c", fontWeight: 700 }}>Spelling Variation (Review Needed)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT 4: AUDIT TRAIL */}
            {activeTab === "audit" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 14px 0" }}>Procurement Officer Immutable Audit Trail</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.78rem" }}>
                  <div style={{ borderLeft: "3px solid #2563eb", paddingLeft: "10px" }}>
                    <strong style={{ color: "#0f172a" }}>Bid Submission Received</strong>
                    <span style={{ color: "#64748b", display: "block" }}>15 May 2025, 11:24 AM • Hash: 0x98F4A10B...</span>
                  </div>
                  <div style={{ borderLeft: "3px solid #16a34a", paddingLeft: "10px" }}>
                    <strong style={{ color: "#0f172a" }}>AI Verification Pipeline Execution Completed</strong>
                    <span style={{ color: "#64748b", display: "block" }}>15 May 2025, 11:26 AM • Confidence Index: 82%</span>
                  </div>
                  {isDecisionLocked && (
                    <div style={{ borderLeft: "3px solid #dc2626", paddingLeft: "10px" }}>
                      <strong style={{ color: "#b91c1c" }}>Officer Decision Immutable Lock Executed ({lockedRecordInfo?.decision?.toUpperCase()})</strong>
                      <span style={{ color: "#64748b", display: "block" }}>{lockedRecordInfo?.timestamp} • Officer: {lockedRecordInfo?.officer}</span>
                      <span style={{ color: "#2563eb", fontFamily: "monospace", display: "block", fontSize: "0.72rem" }}>Lock Hash: {lockedRecordInfo?.hash}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: DOCUMENT VERIFICATION */}
            {activeTab === "document_verification" && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Interactive Document Verification Workbench</h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>Perform individual document inspections and click to verify submitted bidder credentials.</p>
                  </div>
                  <button
                    onClick={handleVerifyAllDocs}
                    style={{
                      background: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 1px 3px rgba(22,163,74,0.2)"
                    }}
                  >
                    <CheckCircle2 size={14} /> Verify All Documents
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {submittedDocuments.map((doc) => {
                    const isDocVerified = doc.status === "Verified" || verifiedDocMap[doc.id];
                    return (
                      <div
                        key={doc.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border: isDocVerified ? "1px solid #cbd5e1" : doc.status === "Issues Found" ? "1px solid #fca5a5" : "1px solid #fed7aa",
                          background: isDocVerified ? "#f8fafc" : doc.status === "Issues Found" ? "#fff5f5" : "#fff7ed"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: isDocVerified ? "#dcfce7" : "#fee2e2",
                            color: isDocVerified ? "#15803d" : "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{doc.type}</h4>
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "8px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                background: isDocVerified ? "#dcfce7" : doc.statusBg,
                                color: isDocVerified ? "#15803d" : doc.statusColor
                              }}>
                                {isDocVerified ? "Verified" : doc.status}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "2px" }}>
                              No: <strong style={{ fontFamily: "monospace", color: "#334155" }}>{doc.number}</strong> • Issued By: {doc.issuedBy} ({doc.issueDate})
                            </span>
                          </div>
                        </div>

                        <div>
                          {isDocVerified ? (
                            <button
                              disabled
                              style={{
                                background: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <CheckCircle2 size={14} /> Document Verified
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifySingleDoc(doc.id)}
                              style={{
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                              }}
                            >
                              <CheckCircle2 size={14} /> Verify Document
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMPLIANCE CHECKS OVERVIEW CARD */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Compliance Checks Overview</h3>
                <button
                  onClick={() => setActiveTab("checks")}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  View All Checks
                </button>
              </div>

              {/* 5 MINI STAT CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: "#64748b" }}>
                    <Info size={14} style={{ color: "#2563eb" }} />
                    <span>Total Checks</span>
                  </div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>{submittedDocuments.length}</strong>
                </div>

                <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: "#16a34a" }}>
                    <Check size={14} style={{ color: "#16a34a" }} />
                    <span>Passed</span>
                  </div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>{verifiedCount}</strong>
                </div>

                <div style={{ background: issuesCount === 0 ? "#f8fafc" : "#fef2f2", border: issuesCount === 0 ? "1px solid #e2e8f0" : "1px solid #fee2e2", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: issuesCount === 0 ? "#64748b" : "#dc2626" }}>
                    <XCircle size={14} style={{ color: issuesCount === 0 ? "#64748b" : "#dc2626" }} />
                    <span>Failed</span>
                  </div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: issuesCount === 0 ? "#64748b" : "#b91c1c" }}>{issuesCount}</strong>
                </div>

                <div style={{ background: issuesCount === 0 ? "#f8fafc" : "#fff7ed", border: issuesCount === 0 ? "1px solid #e2e8f0" : "1px solid #ffedd5", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: issuesCount === 0 ? "#64748b" : "#ea580c" }}>
                    <AlertTriangle size={14} style={{ color: issuesCount === 0 ? "#64748b" : "#ea580c" }} />
                    <span>Warnings</span>
                  </div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: issuesCount === 0 ? "#64748b" : "#c2410c" }}>{issuesCount}</strong>
                </div>

                <div style={{ background: pendingCount === 0 ? "#f0fdf4" : "#eff6ff", border: pendingCount === 0 ? "1px solid #dcfce7" : "1px solid #dbeafe", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: pendingCount === 0 ? "#16a34a" : "#2563eb" }}>
                    <Clock size={14} style={{ color: pendingCount === 0 ? "#16a34a" : "#2563eb" }} />
                    <span>Pending</span>
                  </div>
                  <strong style={{ fontSize: "1.3rem", fontWeight: 800, color: pendingCount === 0 ? "#15803d" : "#1d4ed8" }}>{pendingCount}</strong>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: AI RECOMMENDATION & OFFICER DECISION */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* CARD 1: AI RECOMMENDATION */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>AI Recommendation</h3>
              <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "12px" }}>Automated synthesis based on real-time document verification</span>

              {/* TINTED RECOMMENDATION BOX */}
              {verifiedCount === submittedDocuments.length ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>RECOMMENDATION</span>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#15803d", margin: "2px 0 8px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                    QUALIFIED FOR APPROVAL <CheckCircle2 size={16} />
                  </h4>

                  <div style={{ fontSize: "0.75rem", color: "#334155", lineHeight: 1.5, marginBottom: "12px" }}>
                    <p style={{ margin: "0 0 4px 0" }}>✓ <strong>10/10 Documents Verified:</strong> All statutory credentials confirmed.</p>
                    <p style={{ margin: "0 0 4px 0" }}>✓ <strong>0 Pending Issues:</strong> Solvency and EPFO clearances satisfied.</p>
                    <p style={{ margin: "0 0 8px 0" }}>✓ <strong>100% Score:</strong> Bidder meets all eligibility criteria for tender award.</p>
                  </div>

                  <button
                    onClick={() => setActiveTab("analysis")}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                  >
                    View AI Analysis Details →
                  </button>
                </div>
              ) : (
                <div style={{ background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>RECOMMENDATION</span>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#c2410c", margin: "2px 0 8px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                    REVIEW REQUIRED <span style={{ fontSize: "0.9rem" }}>ⓘ</span>
                  </h4>

                  <div style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5, marginBottom: "12px" }}>
                    <p style={{ margin: "0 0 4px 0" }}>• <strong>{verifiedCount} of {submittedDocuments.length}</strong> documents verified.</p>
                    {issuesCount > 0 && <p style={{ margin: "0 0 4px 0" }}>• <strong>{issuesCount}</strong> document(s) require verification review.</p>}
                    {pendingCount > 0 && <p style={{ margin: "0 0 4px 0" }}>• <strong>{pendingCount}</strong> document(s) pending verification.</p>}
                    <p style={{ margin: "0 0 8px 0" }}>• Click "Verify Document" to confirm bidder credentials.</p>
                  </div>

                  <button
                    onClick={() => setActiveTab("analysis")}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                  >
                    View AI Analysis Details →
                  </button>
                </div>
              )}

              {/* COMPLIANCE BREAKDOWN PROGRESS BARS */}
              <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", margin: "0 0 10px 0" }}>Compliance Breakdown</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.73rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#334155" }}>Statutory Compliance</span>
                    <strong style={{ color: "#0f172a" }}>100%</strong>
                  </div>
                  <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "3px" }}>
                    <div style={{ width: "100%", height: "100%", background: "#16a34a", borderRadius: "3px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#334155" }}>Financial Compliance</span>
                    <strong style={{ color: "#0f172a" }}>{verifiedDocMap[8] ? "100%" : "80%"}</strong>
                  </div>
                  <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "3px" }}>
                    <div style={{ width: verifiedDocMap[8] ? "100%" : "80%", height: "100%", background: "#16a34a", borderRadius: "3px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#334155" }}>Technical Compliance</span>
                    <strong style={{ color: "#0f172a" }}>{verifiedDocMap[9] ? "100%" : "85%"}</strong>
                  </div>
                  <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "3px" }}>
                    <div style={{ width: verifiedDocMap[9] ? "100%" : "85%", height: "100%", background: "#16a34a", borderRadius: "3px" }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ color: "#334155" }}>Document Compliance</span>
                    <strong style={{ color: verifiedCount === 10 ? "#16a34a" : "#ea580c" }}>{Math.round((verifiedCount / 10) * 100)}%</strong>
                  </div>
                  <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "3px" }}>
                    <div style={{ width: `${Math.round((verifiedCount / 10) * 100)}%`, height: "100%", background: verifiedCount === 10 ? "#16a34a" : "#ea580c", borderRadius: "3px" }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* CARD 2: OFFICER DECISION */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>Officer Decision</h3>
              <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginBottom: "12px" }}>Select your decision</span>

              {isDecisionLocked ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 700, marginBottom: "4px" }}>
                    <CheckCircle2 size={16} /> Decision Finalized: {lockedRecordInfo?.decision?.toUpperCase()}
                  </div>
                  <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "0.72rem" }}>Locked by {lockedRecordInfo?.officer} on {lockedRecordInfo?.timestamp}</p>
                  <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#2563eb" }}>Hash: {lockedRecordInfo?.hash}</span>
                </div>
              ) : (
                <>
                  {/* RADIO OPTIONS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="decision"
                        value="qualified"
                        checked={officerDecision === "qualified"}
                        onChange={() => setOfficerDecision("qualified")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#0f172a", display: "block" }}>Qualified</strong>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Bidder is compliant and eligible</span>
                      </div>
                    </label>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="decision"
                        value="disqualified"
                        checked={officerDecision === "disqualified"}
                        onChange={() => setOfficerDecision("disqualified")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#0f172a", display: "block" }}>Disqualified</strong>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Bidder is not compliant</span>
                      </div>
                    </label>

                    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="decision"
                        value="seek_clarification"
                        checked={officerDecision === "seek_clarification"}
                        onChange={() => setOfficerDecision("seek_clarification")}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "0.8rem", color: "#0f172a", display: "block" }}>Seek Clarification</strong>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>More information required</span>
                      </div>
                    </label>

                  </div>

                  {/* PROCEED TO DECISION BUTTON - OPENS AUTHENTICATION MODAL */}
                  <button
                    onClick={() => setShowAuthModal(true)}
                    style={{
                      width: "100%",
                      height: "40px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                    }}
                  >
                    <Lock size={14} /> Proceed to Decision
                  </button>

                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", textAlign: "center", display: "block", marginTop: "10px", lineHeight: 1.3 }}>
                    You will be required to verify using your officer password.
                  </span>
                </>
              )}
            </div>

          </div>

        </div>

        {/* OFFICER DECISION PASSWORD AUTHENTICATION MODAL */}
        {showAuthModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "24px 28px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)",
              border: "1px solid #cbd5e1"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Officer Identity Verification</h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Decision Lock Authentication</span>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "0.78rem" }}>
                <div>Selected Decision: <strong style={{ color: "#2563eb" }}>{officerDecision.toUpperCase()}</strong></div>
                <div>Bidder: <strong style={{ color: "#0f172a" }}>{bidderName}</strong></div>
              </div>

              {authError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", color: "#b91c1c", padding: "8px 12px", borderRadius: "6px", fontSize: "0.75rem", marginBottom: "14px" }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthenticateAndSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Procurement Officer Password <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={officerPassword}
                    onChange={(e) => setOfficerPassword(e.target.value)}
                    placeholder="Enter your officer account password"
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      padding: "0 12px",
                      fontSize: "0.85rem",
                      color: "#0f172a"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      setAuthError("");
                    }}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1.5,
                      height: "38px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <Lock size={14} /> Confirm & Lock Decision
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    );
  };


  // Government Portal Integrations View for Procurement Admin
  const IntegrationsView = () => {
    const initialIntegrations = [
      { id: 1, name: "Udyam / MSME", key: "udyam", category: "Statutory", status: "Connected", lastSync: "2 mins ago", requests: "42,850", apiStatus: "Healthy (99.9% Uptime)", endpoint: "https://api.udyamregistration.gov.in/v1/verify", icon: "🏢" },
      { id: 2, name: "GSTN", key: "gstn", category: "Taxation", status: "Connected", lastSync: "5 mins ago", requests: "128,420", apiStatus: "Healthy (99.8% Uptime)", endpoint: "https://api.gst.gov.in/taxpayer/v1/search", icon: "🏛️" },
      { id: 3, name: "PAN / Income Tax", key: "pan", category: "Taxation", status: "Connected", lastSync: "12 mins ago", requests: "96,110", apiStatus: "Healthy (100% Uptime)", endpoint: "https://incometaxindia.gov.in/api/v2/pan-val", icon: "💳" },
      { id: 4, name: "MCA21", key: "mca21", category: "Corporate", status: "Connected", lastSync: "18 mins ago", requests: "34,500", apiStatus: "Healthy (99.7% Uptime)", endpoint: "https://mca.gov.in/mcafoportal/api/company", icon: "📜" },
      { id: 5, name: "Startup India", key: "startup_india", category: "Incentives", status: "Connected", lastSync: "25 mins ago", requests: "18,290", apiStatus: "Healthy (99.9% Uptime)", endpoint: "https://api.startupindia.gov.in/v1/dpiit-val", icon: "🚀" },
      { id: 6, name: "NSIC", key: "nsic", category: "MSME", status: "Connected", lastSync: "32 mins ago", requests: "12,400", apiStatus: "Healthy (99.5% Uptime)", endpoint: "https://nsic.co.in/api/v1/single-point-reg", icon: "🏭" },
      { id: 7, name: "EPFO", key: "epfo", category: "Labor", status: "Needs Attention", lastSync: "45 mins ago", requests: "52,100", apiStatus: "Latency Warning (450ms)", endpoint: "https://unifiedportal-epfo.gov.in/api/v1/est-search", icon: "👥" },
      { id: 8, name: "ESIC", key: "esic", category: "Labor", status: "Disconnected", lastSync: "2 days ago", requests: "8,920", apiStatus: "Endpoint Timeout (504 Error)", endpoint: "https://esic.gov.in/api/v1/employer-status", icon: "🏥" },
      { id: 9, name: "DigiLocker", key: "digilocker", category: "Identity", status: "Connected", lastSync: "8 mins ago", requests: "88,640", apiStatus: "Healthy (100% Uptime)", endpoint: "https://api.digilocker.gov.in/v2/oauth", icon: "🔐" },
      { id: 10, name: "Make in India", key: "make_in_india", category: "Procurement", status: "Connected", lastSync: "14 mins ago", requests: "29,780", apiStatus: "Healthy (99.8% Uptime)", endpoint: "https://makeinindia.gov.in/api/v1/class1-cert", icon: "🇮🇳" },
      { id: 11, name: "BIS / DPIIT", key: "bis_dpiit", category: "Quality & Standards", status: "Needs Attention", lastSync: "1 hour ago", requests: "15,310", apiStatus: "Certificate Renewal Due", endpoint: "https://bis.gov.in/api/v1/crs-search", icon: "🏅" },
      { id: 12, name: "GeM", key: "gem", category: "Procurement Portal", status: "Connected", lastSync: "Just now", requests: "210,500", apiStatus: "Healthy (99.9% Uptime)", endpoint: "https://api.gem.gov.in/v3/bid-verification", icon: "🛒" }
    ];

    const [integrationsList, setIntegrationsList] = useState(initialIntegrations);
    const [testingId, setTestingId] = useState(null);
    const [configModalItem, setConfigModalItem] = useState(null);
    const [configEndpoint, setConfigEndpoint] = useState("");
    const [configTimeout, setConfigTimeout] = useState("3000ms");

    const connectedCount = integrationsList.filter((i) => i.status === "Connected").length;
    const attentionCount = integrationsList.filter((i) => i.status === "Needs Attention").length;
    const disconnectedCount = integrationsList.filter((i) => i.status === "Disconnected").length;
    const totalCount = integrationsList.length;

    const handleTestConnection = (id) => {
      setTestingId(id);
      setTimeout(() => {
        setIntegrationsList((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              return {
                ...item,
                status: "Connected",
                lastSync: "Just now",
                apiStatus: "Healthy (18ms Latency)"
              };
            }
            return item;
          })
        );
        setTestingId(null);
      }, 800);
    };

    const handleSaveConfig = (e) => {
      e.preventDefault();
      if (!configModalItem) return;
      setIntegrationsList((prev) =>
        prev.map((item) => {
          if (item.id === configModalItem.id) {
            return {
              ...item,
              endpoint: configEndpoint
            };
          }
          return item;
        })
      );
      setConfigModalItem(null);
      alert(`Integration configuration saved for ${configModalItem.name}`);
    };

    const activities = [
      { id: "REQ-9012", timestamp: "12:52:10 PM", portal: "GSTN", query: "POST /taxpayer/v1/search (GSTIN: 27AAPCS1234M1Z5)", status: "200 OK", latency: "18ms", result: "Verified Active" },
      { id: "REQ-9011", timestamp: "12:51:45 PM", portal: "Udyam / MSME", query: "GET /v1/verify?id=UDYAM-MH-12-0012345", status: "200 OK", latency: "24ms", result: "Verified Micro" },
      { id: "REQ-9010", timestamp: "12:50:02 PM", portal: "PAN / Income Tax", query: "POST /v2/pan-val (PAN: AAPCS1234M)", status: "200 OK", latency: "31ms", result: "PAN Active Match" },
      { id: "REQ-9009", timestamp: "12:48:15 PM", portal: "EPFO", query: "GET /api/v1/est-search?reg=GJ/AHM/1234567", status: "200 OK", latency: "420ms", result: "Verification Delayed" },
      { id: "REQ-9008", timestamp: "12:45:00 PM", portal: "ESIC", query: "POST /api/v1/employer-status", status: "504 Timeout", latency: "5000ms", result: "Retry Scheduled" },
      { id: "REQ-9007", timestamp: "12:40:33 PM", portal: "DigiLocker", query: "GET /v2/oauth/doc-hash?id=EMD-98765", status: "200 OK", latency: "12ms", result: "Token Confirmed" },
      { id: "REQ-9006", timestamp: "12:35:19 PM", portal: "Make in India", query: "POST /v1/class1-cert/validate", status: "200 OK", latency: "28ms", result: "Class 1 Valid" }
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "4px" }}>

        {/* PROTOTYPE SANDBOX BANNER */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#f8fafc", padding: "14px 20px", borderRadius: "12px", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.4rem" }}>🎓</span>
            <div>
              <strong style={{ fontSize: "0.88rem", color: "#38bdf8" }}>Demonstration Mode Notice</strong>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#cbd5e1" }}>
                For academic/prototype evaluation purposes, simulated mock integration data and sandbox API gateways are active across all 12 government portals.
              </p>
            </div>
          </div>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#0284c7", color: "#ffffff", padding: "4px 10px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            SANDBOX ACTIVE
          </span>
        </div>

        {/* MAIN HEADER */}
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
            GOVERNMENT PORTAL INTEGRATIONS
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Manage connections with government portals and verification data sources.
          </p>
        </div>

        {/* TOP SUMMARY KPI ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>

          <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>Connected</span>
              <span style={{ fontSize: "1rem" }}>🟢</span>
            </div>
            <strong style={{ fontSize: "1.8rem", fontWeight: 900, color: "#15803d" }}>{connectedCount}</strong>
            <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginTop: "2px" }}>Active API Sync</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #fef08a", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Needs Attention</span>
              <span style={{ fontSize: "1rem" }}>🟡</span>
            </div>
            <strong style={{ fontSize: "1.8rem", fontWeight: 900, color: "#b45309" }}>{attentionCount}</strong>
            <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginTop: "2px" }}>Latency / Cert Renewal</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>Disconnected</span>
              <span style={{ fontSize: "1rem" }}>🔴</span>
            </div>
            <strong style={{ fontSize: "1.8rem", fontWeight: 900, color: "#b91c1c" }}>{disconnectedCount}</strong>
            <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginTop: "2px" }}>Offline / Endpoint 504</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Total Integrations</span>
              <span style={{ fontSize: "1rem" }}>🏛️</span>
            </div>
            <strong style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1e40af" }}>{totalCount}</strong>
            <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginTop: "2px" }}>Registry Data Sources</span>
          </div>

        </div>

        {/* 12 INTEGRATION CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          {integrationsList.map((portal) => {
            const isConnected = portal.status === "Connected";
            const isAttention = portal.status === "Needs Attention";

            return (
              <div
                key={portal.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease"
                }}
              >
                <div>
                  {/* Card Header: Icon, Name & Status Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.6rem" }}>{portal.icon}</span>
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>{portal.name}</h3>
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Category: {portal.category}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "4px 8px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: isConnected ? "#dcfce7" : isAttention ? "#fef9c3" : "#fee2e2",
                        color: isConnected ? "#15803d" : isAttention ? "#a16207" : "#b91c1c"
                      }}
                    >
                      {isConnected ? "🟢 Connected" : isAttention ? "🟡 Needs Attention" : "🔴 Disconnected"}
                    </span>
                  </div>

                  {/* Card Meta Stats Table */}
                  <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                      <span style={{ color: "#64748b" }}>Last Synchronization</span>
                      <strong style={{ color: "#0f172a" }}>{portal.lastSync}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                      <span style={{ color: "#64748b" }}>Verification Requests</span>
                      <strong style={{ color: "#0f172a" }}>{portal.requests}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                      <span style={{ color: "#64748b" }}>API Status</span>
                      <strong style={{ color: isConnected ? "#15803d" : isAttention ? "#b45309" : "#b91c1c" }}>{portal.apiStatus}</strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setConfigModalItem(portal);
                      setConfigEndpoint(portal.endpoint);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#334155",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px"
                    }}
                  >
                    ⚙ Configure
                  </button>

                  <button
                    onClick={() => handleTestConnection(portal.id)}
                    disabled={testingId === portal.id}
                    style={{
                      flex: 1.2,
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: "0 1px 3px rgba(37,99,235,0.2)"
                    }}
                  >
                    {testingId === portal.id ? "Testing..." : "⚡ Test Connection"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* INTEGRATION ACTIVITY SECTION */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>INTEGRATION ACTIVITY</h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>
              Real-time stream of government registry API queries and response logs.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Request ID</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Timestamp</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Government Portal</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>API Query / Endpoint</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Status</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Latency</th>
                  <th style={{ padding: "10px 14px", color: "#475569" }}>Verification Result</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{act.id}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{act.timestamp}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#334155" }}>{act.portal}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#2563eb" }}>{act.query}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "8px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          background: act.status.includes("200") ? "#dcfce7" : "#fee2e2",
                          color: act.status.includes("200") ? "#15803d" : "#b91c1c"
                        }}
                      >
                        {act.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{act.latency}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{act.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONFIGURATION MODAL */}
        {configModalItem && (
          <div className="drawer-overlay" onClick={() => setConfigModalItem(null)}>
            <div className="audit-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
              <div className="drawer-header" style={{ background: "#0f172a", color: "#ffffff", padding: "16px 20px" }}>
                <div className="drawer-title">
                  <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#ffffff" }}>{configModalItem.name} Integration Gateway</h2>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Configure Sandbox/Production API parameters</span>
                </div>
                <button className="close-btn" style={{ color: "#ffffff" }} onClick={() => setConfigModalItem(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveConfig} className="drawer-content" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    API Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={configEndpoint}
                    onChange={(e) => setConfigEndpoint(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", fontFamily: "monospace" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Environment
                  </label>
                  <select style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem" }}>
                    <option value="sandbox">Sandbox / Mock Gateway (College Prototype)</option>
                    <option value="production">Production Gateway (OAuth2 / SSL Mutual Auth)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    API Request Timeout
                  </label>
                  <input
                    type="text"
                    value={configTimeout}
                    onChange={(e) => setConfigTimeout(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setConfigModalItem(null)}
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 1.5, padding: "8px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

  // Reports & Analysis View for Procurement Admin
  const ReportsView = () => {
    const [selectedDateRange, setSelectedDateRange] = useState("01 May 2026 – 31 May 2026");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExportPDF = () => {
      alert("Generating Official GeM Governance PDF Report for period: " + selectedDateRange + "\n\nDownloading 'GeM_Bid_Compliance_Report_May2026.pdf'...");
    };

    const handleExportExcel = () => {
      alert("Exporting Data Matrix to Excel (.xlsx)...\n\nDownloading 'GeM_Compliance_Data_May2026.xlsx' (1,248 Records).");
    };

    const handleGenerateReport = () => {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        alert("Report refreshed successfully! 1,248 bids synchronized with live database records.");
      }, 1000);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#f8fafc", padding: "4px" }}>

        {/* BREADCRUMB & HEADER TOP BAR */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#64748b", marginBottom: "8px" }}>
            <span onClick={() => setActiveSection("dashboard")} style={{ cursor: "pointer", color: "#2563eb", fontWeight: 600 }}>
              Dashboard
            </span>
            <span>›</span>
            <span style={{ color: "#64748b", fontWeight: 600 }}>Governance & Audit</span>
            <span>›</span>
            <strong style={{ color: "#0f172a" }}>Reports & Analysis</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
                REPORT & ANALYSIS
              </h1>
              <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
                Comprehensive overview of bidder compliance, verification performance and AI insights.
              </p>
            </div>

            {/* ACTION BUTTONS & DATE FILTER CONTAINER */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

              {/* DATE RANGE FILTER */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <Calendar size={15} style={{ color: "#2563eb" }} />
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  style={{ border: "none", background: "none", fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", cursor: "pointer", outline: "none" }}
                >
                  <option value="01 May 2026 – 31 May 2026">01 May 2026 – 31 May 2026</option>
                  <option value="01 Apr 2026 – 30 Apr 2026">01 Apr 2026 – 30 Apr 2026</option>
                  <option value="01 Jan 2026 – 31 Mar 2026">Q1 2026 (Jan – Mar)</option>
                  <option value="Year-to-Date 2026">Year-to-Date (2026)</option>
                </select>
              </div>

              {/* EXPORT PDF BUTTON */}
              <button
                onClick={handleExportPDF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#1e293b",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              >
                <Download size={14} style={{ color: "#dc2626" }} /> Export PDF
              </button>

              {/* EXPORT EXCEL BUTTON */}
              <button
                onClick={handleExportExcel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#1e293b",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              >
                <Download size={14} style={{ color: "#16a34a" }} /> Export Excel
              </button>

              {/* GENERATE REPORT BUTTON */}
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                }}
              >
                <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>

            </div>
          </div>
        </div>

        {/* 5 KPI CARDS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>

          {/* Card 1: Total Bids Analyzed */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b" }}>Total Bids Analyzed</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>1,248</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
              <TrendingUp size={12} /> +14.2% vs previous period
            </span>
          </div>

          {/* Card 2: Average Compliance Score */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b" }}>Average Compliance Score</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Award size={16} />
              </div>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#15803d", lineHeight: 1.1 }}>92.4%</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
              <TrendingUp size={12} /> ↑ 4.8% increase this month
            </span>
          </div>

          {/* Card 3: Issues Detected */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b" }}>Issues Detected</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={16} />
              </div>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#c2410c", lineHeight: 1.1 }}>156</div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
              12.5% of total bids flagged for review
            </span>
          </div>

          {/* Card 4: Verification Time Saved */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b" }}>Verification Time Saved</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#7e22ce", lineHeight: 1.1 }}>34.7 hrs</div>
            <span style={{ fontSize: "0.72rem", color: "#7e22ce", fontWeight: 700 }}>
              ⚡ 3.2 min avg AI processing speed
            </span>
          </div>

          {/* Card 5: Approved Bids */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b" }}>Approved Bids</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>1,102</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700 }}>
              88.3% final approval rating
            </span>
          </div>

        </div>

        {/* 5 CHARTS GRID SECTION */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* Chart 1: Compliance Score Over Time (Line / Area Chart) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>1. Compliance Score Over Time</h3>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Weekly progression during May 2026</span>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px" }}>
                Current: 92.4%
              </span>
            </div>

            {/* SVG LINE & AREA CHART */}
            <div style={{ height: "190px", width: "100%", position: "relative" }}>
              <svg width="100%" height="100%" viewBox="0 0 500 170" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />

                {/* Area Fill */}
                <path d="M 0,110 L 100,90 L 200,65 L 300,50 L 400,40 L 500,28 L 500,160 L 0,160 Z" fill="url(#scoreGrad)" />

                {/* Stroke Line */}
                <path d="M 0,110 L 100,90 L 200,65 L 300,50 L 400,40 L 500,28" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

                {/* Data Points */}
                <circle cx="0" cy="110" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="100" cy="90" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="200" cy="65" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="300" cy="50" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="400" cy="40" r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                <circle cx="500" cy="28" r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            {/* X-AXIS DATES */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#64748b", marginTop: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "6px" }}>
              <span>May 01 (87.2%)</span>
              <span>May 07 (88.6%)</span>
              <span>May 14 (90.1%)</span>
              <span>May 21 (91.3%)</span>
              <span>May 28 (92.0%)</span>
              <strong style={{ color: "#16a34a" }}>May 31 (92.4%)</strong>
            </div>
          </div>

          {/* Chart 2: Compliant vs Non-Compliant Bids (Donut Progress Chart) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>2. Compliant vs Non-Compliant Bids</h3>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Ratio of bids meeting statutory rules</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "190px" }}>

              {/* DONUT SVG */}
              <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="140" height="140" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#fee2e2" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="88.3, 100" />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", display: "block", lineHeight: 1 }}>88.3%</span>
                  <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 700 }}>Compliant</span>
                </div>
              </div>

              {/* LEGEND BADGES */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }}></div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>1,102 Compliant Bids</strong>
                    <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>88.3% Total Rate</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626" }}></div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>146 Non-Compliant Bids</strong>
                    <span style={{ fontSize: "0.7rem", color: "#dc2626" }}>11.7% Flagged Rate</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Chart 3: Issues by Category (Bar Breakdown) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>3. Issues by Category</h3>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Distribution across 156 total flagged issues</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.78rem" }}>

              {/* Category 1: Statutory */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Statutory & Tax Verification (GSTN, PAN, EPFO)</span>
                  <strong style={{ color: "#2563eb" }}>58 Issues (37.2%)</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: "37.2%", height: "100%", background: "#2563eb", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 2: Financial */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Financial Solvency & Turnover Certificates</span>
                  <strong style={{ color: "#ea580c" }}>42 Issues (26.9%)</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: "26.9%", height: "100%", background: "#ea580c", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 3: Technical */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Technical OEM Authorization & Specs</span>
                  <strong style={{ color: "#9333ea" }}>34 Issues (21.8%)</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: "21.8%", height: "100%", background: "#9333ea", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 4: Document */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Document Format & Expiry Date Mismatches</span>
                  <strong style={{ color: "#dc2626" }}>22 Issues (14.1%)</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: "14.1%", height: "100%", background: "#dc2626", borderRadius: "4px" }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Chart 4: Risk Distribution & Chart 5: Verification Status */}
          <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "16px" }}>

            {/* Chart 4: Risk Distribution */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>4. Risk Distribution</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 6px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 700, display: "block" }}>LOW RISK</span>
                  <strong style={{ fontSize: "1.1rem", color: "#15803d" }}>898</strong>
                  <span style={{ fontSize: "0.65rem", color: "#64748b", display: "block" }}>72.0%</span>
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "10px 6px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#ea580c", fontWeight: 700, display: "block" }}>MEDIUM</span>
                  <strong style={{ fontSize: "1.1rem", color: "#c2410c" }}>250</strong>
                  <span style={{ fontSize: "0.65rem", color: "#64748b", display: "block" }}>20.0%</span>
                </div>
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 6px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700, display: "block" }}>HIGH RISK</span>
                  <strong style={{ fontSize: "1.1rem", color: "#b91c1c" }}>75</strong>
                  <span style={{ fontSize: "0.65rem", color: "#64748b", display: "block" }}>6.0%</span>
                </div>
                <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", padding: "10px 6px", borderRadius: "8px", color: "#ffffff" }}>
                  <span style={{ fontSize: "0.68rem", color: "#fca5a5", fontWeight: 700, display: "block" }}>CRITICAL</span>
                  <strong style={{ fontSize: "1.1rem", color: "#ffffff" }}>25</strong>
                  <span style={{ fontSize: "0.65rem", color: "#fecaca", display: "block" }}>2.0%</span>
                </div>
              </div>
            </div>

            {/* Chart 5: Verification Status */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>5. Verification Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Approved & Qualified</span>
                  <strong style={{ color: "#16a34a" }}>1,102 (88.3%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Pending Officer Review</span>
                  <strong style={{ color: "#2563eb" }}>84 (6.7%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Clarification Requested</span>
                  <strong style={{ color: "#ea580c" }}>42 (3.4%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Disqualified / Rejected</span>
                  <strong style={{ color: "#dc2626" }}>20 (1.6%)</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* KEY FINDINGS PANEL */}
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "14px", padding: "22px 26px", color: "#ffffff", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
            <Sparkles size={20} style={{ color: "#38bdf8" }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>Key Verification Findings</h3>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Automated synthesis of bidder compliance anomalies & highlights</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>MOST COMMON ISSUES</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • <strong>GSTIN Return Delays:</strong> 38% of flagged bids<br />
                • <strong>OEM Letter Name Mismatch:</strong> 27%<br />
                • <strong>Bank Solvency Expiry:</strong> 21%
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>FREQUENTLY MISSING DOCS</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • <strong>Latest GSTR-3B Receipts:</strong> 45% missing<br />
                • <strong>EPFO Compliance Clearance:</strong> 32% missing<br />
                • <strong>Udyam MSME Annexure:</strong> 23% missing
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>AVERAGE VERIFICATION TIME</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • <strong>AI Processing Speed:</strong> 3.2 minutes / bid<br />
                • <strong>Manual Time Saved:</strong> 34.7 total hours<br />
                • <strong>Turnaround Improvement:</strong> 94% faster
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#f43f5e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>HIGHEST-RISK CATEGORY</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • <strong>Financial Solvency & Turnover</strong><br />
                • Accounts for 42% of high-risk score deductions due to expired certificate dates.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>COMPLIANCE IMPROVEMENT</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • <strong>Overall Score Growth:</strong> +6.8% MoM<br />
                • Vendor alignment score increased from 85.6% to 92.4% within 30 days.
              </p>
            </div>

          </div>
        </div>

        {/* FOUR REQUIRED NARRATIVE SECTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* SECTION 1: ANALYSIS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <FileText size={18} style={{ color: "#2563eb" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>ANALYSIS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              The <strong>AI-Powered Integrated Bid Compliance Verification Platform</strong> analyzed <strong>1,248 procurement bids</strong> during May 2026. Automated OCR parsing coupled with direct Government REST API webhooks (CBDT, GSTN, MSME Udyam, EPFO) achieved a <strong>98.6% automatic extraction fidelity rate</strong>.
            </p>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: "10px 0 0 0" }}>
              Throughput efficiency improved dramatically, reducing average verification latency down to <strong>3.2 minutes per submission</strong> compared to historical manual benchmarks of 4.5 hours per tender file.
            </p>
          </div>

          {/* SECTION 2: INSIGHTS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <Sparkles size={18} style={{ color: "#9333ea" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>INSIGHTS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Deep pattern recognition across 156 flagged items revealed that <strong>37.2% of non-compliance issues</strong> stem from minor entity naming variations between GSTIN Registrant records and original OEM Authorization letters (e.g. "Pvt. Ltd." vs "Private Limited").
            </p>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: "10px 0 0 0" }}>
              Furthermore, MSME bidders demonstrated a <strong>97% compliance score when Udyam validation was active</strong>, confirming the efficacy of automated EMD waiver verification pipelines.
            </p>
          </div>

          {/* SECTION 3: CONCLUSIONS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>CONCLUSIONS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Overall bidder compliance on GeM procurement has reached an all-time high of <strong>92.4% average score</strong>. The introduction of immutable cryptographic audit hashing has eliminated post-decision tampering risks, ensuring 100% legal enforceability across all 1,102 approved bids.
            </p>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: "10px 0 0 0" }}>
              Procurement Officer manual review backlog was reduced by <strong>84%</strong>, allowing officers to focus exclusively on flagged high-risk edge cases.
            </p>
          </div>

          {/* SECTION 4: RECOMMENDATIONS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <ShieldCheck size={18} style={{ color: "#ea580c" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>RECOMMENDATIONS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              1. <strong>Pre-Submission Sanity Widget:</strong> Deploy an automated real-time pre-check widget in the bidder upload portal to notify suppliers of expired Bank Solvency certificates prior to final bid submission.
            </p>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: "8px 0 0 0" }}>
              2. <strong>Fuzzy Entity Name Matching:</strong> Enhance the AI NLP matching model threshold to automatically resolve standard legal entity abbreviations without flagging unnecessary manual officer reviews.
            </p>
          </div>

        </div>

      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return role === "Buyer" ? (
          <SectionPlaceholder
            title="Officer Profile"
            description="Review details relating to your security clearances and portal role."
            rows={[
              { label: "Officer Name", value: user ? user.full_name : "Dr. Shashi Kumar (Auditor)" },
              { label: "Clearance Authority", value: "GeM Audit Division" },
              { label: "Clearance Level", value: user?.role === "ADMIN" ? "Super Administrator" : "Level-3 Compliance Officer" },
              { label: "Officer Email", value: user ? user.email : "officer@gem.gov.in" }
            ]}
          />
        ) : (
          <BidderProfile />
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
      case "integrations":
        return isAdmin ? <IntegrationsView /> : <BuyerDashboardView />;
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

        <main className="bidder-main" style={{ paddingBottom: "80px" }}>
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
                <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "110px", height: "110px" }}>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={selectedBid.score >= 80 ? "#10b981" : selectedBid.score >= 50 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(selectedBid.score / 100) * 251.2} 251.2`}
                        strokeDashoffset="0"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{selectedBid.score}%</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: "700", color: selectedBid.score >= 80 ? "#10b981" : "#f59e0b", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.05em" }}>MATCH</span>
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
              <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                      stroke={selectedBid.score >= 80 ? "#10b981" : selectedBid.score >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(selectedBid.score / 100) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{selectedBid.score}%</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: "700", color: selectedBid.score >= 80 ? "#10b981" : "#f59e0b", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.05em" }}>MATCH</span>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>Compliance Score & Risk Rating</h3>
                  <p style={{ fontSize: "0.85rem", color: "#475569", textAlign: "left", marginBottom: "8px" }}>
                    Weighted registry status, automated OCR verification, and GSTIN/PAN name matching.
                  </p>
                  <span className={`risk-badge ${selectedBid.risk.toLowerCase()}`}>
                    {selectedBid.risk} Risk Rating
                  </span>
                  <span className={`status-badge ${selectedBid.status.toLowerCase().replace(" ", "")}`} style={{ marginLeft: "10px" }}>
                    ● {selectedBid.status}
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

      {/* Selected Tender Details Inspection Modal */}
      {selectedTender && (
        <div className="drawer-overlay" onClick={() => setSelectedTender(null)}>
          <div className="audit-drawer studio-modal" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "#ffffff", padding: "20px 24px" }}>
              <div className="drawer-title">
                <span className="hero-eyebrow" style={{ color: "#e0f2fe" }}>GEM PROCUREMENT OPPORTUNITY</span>
                <h2 style={{ fontSize: "1.35rem", margin: "4px 0", color: "#ffffff" }}>{selectedTender.title}</h2>
                <span style={{ fontSize: "0.85rem", opacity: 0.9, color: "#f0f9ff" }}>
                  Tender Reference: <strong>{selectedTender.id}</strong> | Department: <strong>{selectedTender.department}</strong>
                </span>
              </div>
              <button className="close-btn" style={{ color: "#ffffff", background: "rgba(255, 255, 255, 0.2)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1.1rem" }} onClick={() => setSelectedTender(null)}>✕</button>
            </div>

            <div className="drawer-content" style={{ padding: "24px" }}>
              {/* Tender Key Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "8px" }}>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>ESTIMATED VALUE</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{selectedTender.value}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>CLOSING DEADLINE</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0284c7", marginTop: "2px" }}>{selectedTender.deadline}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>CATEGORY</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#10b981", marginTop: "2px" }}>{selectedTender.category}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>EMD STATUS</span>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#b45309", marginTop: "2px" }}>Exempt (MSME)</div>
                </div>
              </div>

              {/* Technical Specifications & Requirements */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", background: "#ffffff" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  📋 Technical Scope & Mandatory Criteria
                </h4>
                <ul style={{ listStyle: "disc", paddingLeft: "20px", fontSize: "0.88rem", color: "#334155", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>Scope of Supply:</strong> Design, testing, supply, and on-site commissioning at {selectedTender.department} premises.</li>
                  <li><strong>Warranty Terms:</strong> Minimum 36 Months OEM On-Site Comprehensive Warranty from date of final acceptance.</li>
                  <li><strong>Financial Turnover:</strong> Minimum Average Annual Turnover of ₹25 Lakhs across the last 3 financial years.</li>
                  <li><strong>Local Content Preference:</strong> Class-1 Local Supplier preference applicable under Public Procurement Order 2017.</li>
                </ul>
              </div>

              {/* Required Documents Matrix */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", background: "#ffffff" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  🛡️ Required Mandatory Certificates
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #e2e8f0" }}>
                    <strong>GSTIN Certificate</strong> — GSTN Active Verification
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #e2e8f0" }}>
                    <strong>PAN Card</strong> — CBDT Name Matching
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #e2e8f0" }}>
                    <strong>Udyam MSME</strong> — Purchase Preference Certificate
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #e2e8f0" }}>
                    <strong>OEM Authorization</strong> — Valid Manufacturer Authorization Letter
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-actions" style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                style={{ background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", padding: "10px 22px", fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)" }}
                onClick={() => { setSelectedTender(null); setActiveSection("documents"); }}
              >
                + Prepare Bid & Upload Docs →
              </button>
              <button
                type="button"
                style={{ background: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", padding: "10px 20px", fontSize: "0.9rem", cursor: "pointer" }}
                onClick={() => setSelectedTender(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;