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
  Plus
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
      }
    ];

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
              justifyContent: "space-between", 
              alignItems: "center",
              cursor: "pointer",
              boxShadow: activeKpi === "ALL" ? "0 4px 12px rgba(37,99,235,0.12)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            <div>
              <span style={{ fontSize: "0.73rem", fontWeight: 700, color: activeKpi === "ALL" ? "#2563eb" : "#64748b", display: "block" }}>Total Bidders</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>248</h2>
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
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>142</h2>
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
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>18</h2>
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
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>17</h2>
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
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>128</h2>
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
              <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>06</h2>
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
            <span>Showing 1 to {filteredBidders.length} of 248 bidders</span>

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

  // Advanced AI Bid Verification Dashboard View component
  const VerificationView = () => {
    const [verificationStep, setVerificationStep] = useState("matrix");
    const [decisionRemarks, setDecisionRemarks] = useState("");
    const [reviewedCheckbox, setReviewedCheckbox] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState(""); // qualify, clarification, disqualify

    const currentBidderName = selectedVerificationBidder ? selectedVerificationBidder.name : "ABC Engineering Pvt. Ltd.";
    const currentTenderId = selectedVerificationBidder ? selectedVerificationBidder.tender : "GEM-CPCL-001";
    const currentBidId = selectedVerificationBidder ? selectedVerificationBidder.id : 1;
    const currentCompliance = selectedVerificationBidder ? selectedVerificationBidder.compliance : 98.4;
    const currentRisk = selectedVerificationBidder ? selectedVerificationBidder.risk : "LOW";

    const lockedRecord = decidedBids[currentBidId];

    if (verificationStep === "decision") {
      return (
        <div className="verification-dashboard-content">
          {/* Bid Information Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Final Compliance Review</h1>
              <p className="subtitle" style={{ margin: "0", fontSize: "0.95rem" }}>
                Tender: <strong style={{ color: "#0f172a" }}>{currentTenderId}</strong> | Bidder: <strong style={{ color: "#0f172a" }}>{currentBidderName}</strong> | Submission ID: <strong style={{ color: "#0f172a" }}>BID-2026-0045</strong>
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
                <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "110px", height: "110px" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={currentCompliance >= 90 ? "#10b981" : currentCompliance >= 70 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentCompliance / 100) * 251.2} 251.2`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: "1.45rem", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{currentCompliance}%</span>
                  </div>
                </div>
                <div>
                  <span className="card-label">Compliance Score</span>
                  <div style={{ marginTop: "6px" }}>
                    <span className={`risk-badge ${currentRisk.toLowerCase()}`}>
                      {currentRisk} RISK
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
                <h2 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Evidence-Based Compliance Matrix</h2>
                <table style={{ margin: "0" }}>
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Result</th>
                      <th>Evidence Document</th>
                      <th>Verification Source</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PAN Verification</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>PAN_Certificate.pdf</td>
                      <td>CBDT API</td>
                      <td><strong>99%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>GST Registration</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>GST_Certificate.pdf</td>
                      <td>GSTN Portal</td>
                      <td><strong>98%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Udyam MSME</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>Udyam_Registration.pdf</td>
                      <td>MSME Portal</td>
                      <td><strong>97%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Income Tax Returns</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>ITR_3Years.pdf</td>
                      <td>IT Portal</td>
                      <td><strong>94%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>OEM Authorization</strong></td>
                      <td><span style={{ color: "#f59e0b", fontWeight: 600 }}>REVIEW</span></td>
                      <td>OEM_Authorization.pdf</td>
                      <td style={{ color: "#ef4444", fontWeight: 500 }}>Mismatch detected</td>
                      <td><strong style={{ color: "#f59e0b" }}>82%</strong></td>
                    </tr>
                    <tr>
                      <td><strong>Make in India Declaration</strong></td>
                      <td><span style={{ color: "#10b981", fontWeight: 600 }}>PASS</span></td>
                      <td>MII_Declaration.pdf</td>
                      <td>Self Declaration</td>
                      <td><strong>96%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Recommendation Card */}
              <div className="ai-assistant-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} style={{ color: "#6366f1" }} />
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>AI Recommendation Panel</h3>
                  </div>
                  <span className="status-badge review" style={{ fontSize: "0.8rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                    RECOMMENDS CONDITIONAL APPROVAL
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: "1.5", margin: "0 0 12px 0" }}>
                  "Evaluation Summary: Bidder has verified financial and statutory filings. The OEM authorization letter has an entity name spelling variation that requires Officer confirmation."
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <ShieldCheck size={14} style={{ color: "#0284c7" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0284c7" }}>
                    AI recommendation is decision support only. Final decision rests solely with the Procurement Officer.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Evidence Viewer */}
            <div className="split-right-col" style={{ flexGrow: 1 }}>
              <div className="recent-activity-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "1.05rem", margin: 0, fontWeight: 800 }}>OEM_Authorization.pdf</h3>
                  <span className="status-badge review" style={{ fontSize: "0.75rem" }}>Evidence Inspection</span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", flexGrow: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Manufacturer</small>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>XYZ Pumps Ltd</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Bidder</small>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{currentBidderName}</strong>
                    </div>
                    <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "12px" }}>
                      <small style={{ color: "#e11d48", display: "block", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>AI Finding</small>
                      <strong style={{ fontSize: "0.9rem", color: "#e11d48" }}>Minor entity-name variant detected</strong>
                    </div>
                    <div>
                      <small style={{ color: "#64748b", display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>AI Explanation</small>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#475569", lineHeight: "1.5" }}>
                        "Document authorizes {currentBidderName}. Verification confirmed with manufacturer registration database."
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

          {/* Bottom Final Decision Section (One-time Entry Rule) */}
          {lockedRecord ? (
            <div className={`locked-decision-card ${lockedRecord.decision}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Lock size={22} style={{ color: lockedRecord.decision === "qualify" ? "#15803d" : lockedRecord.decision === "clarify" ? "#b45309" : "#b91c1c" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a", fontWeight: 800 }}>
                      Officer Decision Finalized: {lockedRecord.decision.toUpperCase()}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Authorized by <strong>{lockedRecord.officerId}</strong> on {lockedRecord.timestamp}
                    </span>
                  </div>
                </div>
                <span className={`decision-badge ${lockedRecord.decision}`}>
                  IMMUTABLE RECORD
                </span>
              </div>

              <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <small style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Officer Justification Remarks</small>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.92rem", color: "#1e293b", fontWeight: 500 }}>"{lockedRecord.remarks}"</p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
                <span>Audit Lock Hash: <strong style={{ fontFamily: "monospace", color: "#0284c7" }}>{lockedRecord.lockHash}</strong></span>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} /> Decision Locked — Cannot Be Modified (One-Time Rule Enforced)
                </span>
              </div>
            </div>
          ) : (
            <div className="section-panel" style={{ padding: "24px", marginTop: "24px", border: "1px solid #cbd5e1" }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "#0f172a" }}>Officer Procurement Decision</h2>
              <p className="subtitle" style={{ marginTop: "-10px", marginBottom: "16px", fontSize: "0.85rem" }}>
                Note: Once finalized, your decision will be locked immutably into the procurement audit trail.
              </p>
              
              <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                <button
                  className={`secondary-action-btn ${selectedDecision === "qualify" ? "active-decision qualify" : ""}`}
                  style={{ flexGrow: 1, height: "48px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #10b981", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: selectedDecision === "qualify" ? "#dcfce7" : "#ffffff" }}
                  onClick={() => setSelectedDecision("qualify")}
                >
                  <ShieldCheck size={18} /> QUALIFY BID
                </button>
                <button
                  className={`secondary-action-btn ${selectedDecision === "clarify" ? "active-decision clarify" : ""}`}
                  style={{ flexGrow: 1, height: "48px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #f59e0b", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: selectedDecision === "clarify" ? "#fef3c7" : "#ffffff" }}
                  onClick={() => setSelectedDecision("clarify")}
                >
                  <HelpCircle size={18} /> REQUEST CLARIFICATION
                </button>
                <button
                  className={`secondary-action-btn ${selectedDecision === "disqualify" ? "active-decision disqualify" : ""}`}
                  style={{ flexGrow: 1, height: "48px", borderRadius: "10px", fontWeight: "bold", border: "2px solid #ef4444", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: selectedDecision === "disqualify" ? "#fee2e2" : "#ffffff" }}
                  onClick={() => setSelectedDecision("disqualify")}
                >
                  <XCircle size={18} /> DISQUALIFY BID
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Decision Justification & Remarks</label>
                <textarea
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Enter final decision justification, compliance findings, or clarification details..."
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
                  I confirm I have thoroughly reviewed the compliance matrix, AI findings, and submitted evidence documents.
                </label>
              </div>

              <button
                className="primary-action-btn"
                disabled={!reviewedCheckbox || !selectedDecision}
                onClick={() => {
                  const bidKey = currentBidId;
                  const timestamp = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
                  const randomHash = "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();

                  const decisionRecord = {
                    decision: selectedDecision,
                    remarks: decisionRemarks || "Compliance evaluation verified & approved by Procurement Officer.",
                    timestamp,
                    officerId: user?.full_name || "Procurement Officer #OFF-9821",
                    lockHash: randomHash
                  };

                  setDecidedBids((prev) => ({
                    ...prev,
                    [bidKey]: decisionRecord
                  }));
                }}
                style={{ height: "46px", padding: "0 24px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Lock size={16} /> Confirm & Lock Decision →
              </button>
            </div>
          )}

          {/* Audit Information Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Officer: <strong>{user?.full_name || "Procurement Officer #OFF-9821"}</strong>
              </span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Verification Status: <strong>{lockedRecord ? "FINALIZED & LOCKED" : "IN PROGRESS"}</strong>
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