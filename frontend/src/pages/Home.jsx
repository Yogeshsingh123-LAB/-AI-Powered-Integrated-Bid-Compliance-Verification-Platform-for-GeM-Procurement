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
  Clock,
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
  Maximize2,
  Trash2,
  Key,
  Settings,
  Cpu,
  Database,
  RotateCcw,
  Save,
  Megaphone,
  Radio
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

const INITIAL_BLACKLISTED_BIDDERS = [
  {
    id: "BLK-2026-001",
    name: "Vanguard Systems Ltd",
    pan: "AABCV9876K",
    gstin: "27AABCV9876K1Z9",
    type: "Public Limited",
    reason: "Forged Solvency Certificate & Registry Name Mismatch",
    violationCategory: "Document Forgery & Fraud",
    debarmentOrderNo: "CVC/DEBAR/2025/089",
    authority: "Central Vigilance Commission (CVC)",
    startDate: "10 Jan 2025",
    endDate: "10 Jan 2028",
    duration: "3 Years",
    severity: "CRITICAL",
    status: "Active Debarment",
    statusBg: "#fef2f2",
    statusColor: "#dc2626",
    contactEmail: "legal@vanguardsystems.in",
    contactPhone: "+91 98230 11223",
    investigationHash: "0x89F2A90CDE11234598001122AA3344FF",
    notes: "Detected during automated OCR cross-verification. Solvency certificate issued under non-existent branch code with forged bank stamp."
  },
  {
    id: "BLK-2026-002",
    name: "Delta Infra Tech Solutions",
    pan: "AACCD5432P",
    gstin: "24AACCD5432P1Z2",
    type: "Private Limited",
    reason: "Cartel Formation & Collusive Bidding in CPCL Tender #004",
    violationCategory: "Cartelization & Collusion",
    debarmentOrderNo: "GeM/DISC/2025/104",
    authority: "GeM Disciplinary Board",
    startDate: "15 Mar 2025",
    endDate: "15 Mar 2030",
    duration: "5 Years",
    severity: "CRITICAL",
    status: "Active Debarment",
    statusBg: "#fef2f2",
    statusColor: "#dc2626",
    contactEmail: "compliance@deltainfra.com",
    contactPhone: "+91 97123 44556",
    investigationHash: "0x77E11029BC44556677889900AABBCCDD",
    notes: "IP log matching & identical bank guarantee metadata submitted across 3 ostensibly competing bidders."
  },
  {
    id: "BLK-2026-003",
    name: "Apex Global Supplies LLP",
    pan: "ABFFA9988R",
    gstin: "07ABFFA9988R1Z1",
    type: "LLP",
    reason: "Default on EMD Commitment & Repeated Order Cancellation",
    violationCategory: "Financial & EMD Default",
    debarmentOrderNo: "MoPNG/DIR/2024/442",
    authority: "Ministry of Petroleum & Natural Gas",
    startDate: "01 Aug 2024",
    endDate: "01 Aug 2026",
    duration: "2 Years",
    severity: "HIGH",
    status: "Active Debarment",
    statusBg: "#fff7ed",
    statusColor: "#c2410c",
    contactEmail: "info@apexsupplies.llp",
    contactPhone: "+91 99001 88776",
    investigationHash: "0x11223344556677889900AABBCCDDEEFF",
    notes: "Refused contract execution after L1 selection without legitimate force majeure justification."
  },
  {
    id: "BLK-2026-004",
    name: "Standard Logistics & Freight Co.",
    pan: "AAACS7766M",
    gstin: "27AAACS7766M1Z8",
    type: "Partnership",
    reason: "Fake MSME Udyam Certificate Submission",
    violationCategory: "Misrepresentation",
    debarmentOrderNo: "MSME/VIG/2025/012",
    authority: "Ministry of MSME Audit Cell",
    startDate: "12 Dec 2024",
    endDate: "12 Dec 2027",
    duration: "3 Years",
    severity: "HIGH",
    status: "Active Debarment",
    statusBg: "#fff7ed",
    statusColor: "#c2410c",
    contactEmail: "admin@standardfreight.co.in",
    contactPhone: "+91 98450 66778",
    investigationHash: "0x55667788990011223344AABBCCDDEEFF",
    notes: "Udyam registration number belonged to an unrelated textile unit in Tamil Nadu."
  },
  {
    id: "BLK-2026-005",
    name: "Zenith Electronics & Power Solutions",
    pan: "AABCZ1122E",
    gstin: "19AABCZ1122E1Z3",
    type: "Private Limited",
    reason: "CVC Integrity Pact Breach & False Declaration",
    violationCategory: "Integrity Pact Violation",
    debarmentOrderNo: "CVC/DEBAR/2023/901",
    authority: "Central Vigilance Commission (CVC)",
    startDate: "05 May 2023",
    endDate: "05 May 2028",
    duration: "5 Years",
    severity: "CRITICAL",
    status: "Active Debarment",
    statusBg: "#fef2f2",
    statusColor: "#dc2626",
    contactEmail: "contact@zenithelectronics.com",
    contactPhone: "+91 91234 56789",
    investigationHash: "0x9900AABBCCDDEEFF1122334455667788",
    notes: "Hidden sub-contracting to a banned subsidiary company."
  }
];

const INITIAL_TENDERS_DATA = [
  { id: "CPCL/2026/001", title: "Industrial Equipment Supply", category: "Equipment", department: "Projects", publishedDate: "08 May 2026", closingDate: "30 May 2026", daysLeft: "2 days left", bidders: 12, pending: 5, status: "Active" },
  { id: "CPCL/2026/002", title: "Pipeline Components", category: "Infrastructure", department: "Projects", publishedDate: "06 May 2026", closingDate: "02 Jun 2026", daysLeft: "5 days left", bidders: 18, pending: 3, status: "Active" },
  { id: "CPCL/2026/003", title: "Electrical Materials Supply", category: "Electrical", department: "Engineering", publishedDate: "05 May 2026", closingDate: "10 Jun 2026", daysLeft: "7 days left", bidders: 9, pending: 2, status: "Active" },
  { id: "CPCL/2026/004", title: "Maintenance Services", category: "Services", department: "Operations", publishedDate: "01 May 2026", closingDate: "15 Jun 2026", daysLeft: "18 days left", bidders: 7, pending: 1, status: "Active" },
  { id: "CPCL/2026/005", title: "Safety Equipment Supply", category: "Safety", department: "Operations", publishedDate: "30 Apr 2026", closingDate: "20 Jun 2026", daysLeft: "23 days left", bidders: 11, pending: 2, status: "Active" },
  { id: "CPCL/2026/006", title: "Office Furniture Supply", category: "General", department: "Admin", publishedDate: "20 Apr 2026", closingDate: "25 Apr 2026", daysLeft: null, bidders: 6, pending: 0, status: "Closed" },
  { id: "CPCL/2026/007", title: "Civil Construction Works", category: "Works", department: "Projects", publishedDate: "10 Apr 2026", closingDate: "18 Apr 2026", daysLeft: null, bidders: 15, pending: 0, status: "Closed" },
  { id: "CPCL/2026/008", title: "Canteen Services", category: "Services", department: "Admin", publishedDate: "05 Apr 2026", closingDate: "12 Apr 2026", daysLeft: null, bidders: 5, pending: 0, status: "Cancelled" },
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [announcementConfig, setAnnouncementConfig] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("gem_announcement_config") : null;
    return saved
      ? JSON.parse(saved)
      : {
        enabled: true,
        badgeText: "📢 LIVE ANNOUNCEMENTS",
        text: "✦ Welcome to BidVerify Government e-Auction & Compliance Verification Portal ✦ Real-Time GSTIN, PAN, Udyam MSME & OEM Authorization Verification Active ✦ Tender GEM-CPCL-2026-001 Live ✦ Helpdesk: 1800-425-8888 (Toll Free) ✦",
        type: "NOTICE",
        speed: "NORMAL"
      };
  });

  const [biddersInitialFilter, setBiddersInitialFilter] = useState({ risk: "All", verification: "All" });
  const [selectedTenderForBidders, setSelectedTenderForBidders] = useState(null);
  const [selectedVerificationBidder, setSelectedVerificationBidder] = useState(null);
  const [decidedBids, setDecidedBids] = useState({});

  const [tendersList, setTendersList] = useState(INITIAL_TENDERS_DATA);
  const [editingTenderModalItem, setEditingTenderModalItem] = useState(null);
  const [activeTenderMenuId, setActiveTenderMenuId] = useState(null);

  // Security Authorization Modal State for Tender Operations
  const [pendingTenderAction, setPendingTenderAction] = useState(null);
  const [actionPasswordInput, setActionPasswordInput] = useState("");
  const [actionPasswordError, setActionPasswordError] = useState("");

  const verifyAndExecuteTenderAction = (e) => {
    if (e) e.preventDefault();
    if (!pendingTenderAction) return;

    const inputPass = actionPasswordInput.trim();
    if (!inputPass) {
      setActionPasswordError("Password is required to authorize this tender operation.");
      return;
    }

    const currentRoleUpper = (role || user?.role || "").toUpperCase();
    const isUserAdmin = isAdmin || currentRoleUpper.includes("ADMIN");

    if (isUserAdmin) {
      // ADMIN Context: Only Admin Password works
      if (inputPass === "officer123" || inputPass === "officer") {
        setActionPasswordError("❌ Access Denied: Procurement Officer passwords are invalid on the Admin page. Please enter your Admin Password.");
        return;
      }
      const validAdminPass = user?.password || "admin123";
      if (inputPass !== validAdminPass && inputPass !== "admin123") {
        setActionPasswordError("❌ Invalid Admin Password! Please try again.");
        return;
      }
    } else {
      // PROCUREMENT OFFICER Context: Only Officer Password works
      if (inputPass === "admin123" || inputPass === "admin") {
        setActionPasswordError("❌ Access Denied: Admin passwords are invalid on the Procurement Officer page. Please enter your Officer Password.");
        return;
      }
      const validOfficerPass = user?.password || "officer123";
      if (inputPass !== validOfficerPass && inputPass !== "officer123" && inputPass !== "officer") {
        setActionPasswordError("❌ Invalid Procurement Officer Password! Please try again.");
        return;
      }
    }

    // Authorized! Execute action
    const { type, payload } = pendingTenderAction;
    if (type === "CREATE") {
      setTendersList(prev => [payload.newTenderObj, ...prev]);
      if (payload.onSuccess) payload.onSuccess();
    } else if (type === "EDIT") {
      setTendersList(prev => prev.map(t => t.id === payload.editedTender.id ? payload.editedTender : t));
      setEditingTenderModalItem(null);
    } else if (type === "STATUS") {
      setTendersList(prev => prev.map(t => t.id === payload.tenderId ? {
        ...t,
        status: payload.newStatus,
        daysLeft: payload.newStatus === "Active" ? (t.daysLeft || "7 days left") : null
      } : t));
      setActiveTenderMenuId(null);
    } else if (type === "DELETE") {
      setTendersList(prev => prev.filter(t => t.id !== payload.tenderId));
      setActiveTenderMenuId(null);
    }

    // Reset password state & close modal
    setActionPasswordInput("");
    setActionPasswordError("");
    setPendingTenderAction(null);
  };

  const handleTenderClickFromDashboard = (tenderId) => {
    const found = tendersList.find(t => t.id === tenderId) || tendersList[0];
    setSelectedTenderForBidders(found);
    setActiveSection("tenders");
  };



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

  // Admin role check (User Management & Integrations tabs are accessible via Profile Menu)
  const isAdmin =
    role === "ADMIN" ||
    role === "Admin" ||
    role === "Super Admin" ||
    user?.role?.toUpperCase() === "ADMIN" ||
    user?.role?.toUpperCase() === "SUPER ADMIN" ||
    user?.role?.toUpperCase()?.includes("ADMIN") ||
    user?.email === "admin@gem.gov.in";

  // 2. Buyer (Officer) Navigation Items
  const buyerNav = [
    { id: "dashboard", label: "Dashboard" },
    { id: "tenders", label: "Tenders" },
    { id: "bidders", label: "Bidders" },
    { id: "verification", label: "Verification" },
    { id: "reports", label: "Reports" },
    ...(isAdmin ? [{ id: "blacklistedBidders", label: "Blacklisted Bidders" }] : [])
  ];

  const navigationItems = role === "Supplier" ? supplierNav : buyerNav;

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
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => handleTenderClickFromDashboard("CPCL/2026/001")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/002</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Pipeline Components</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>18</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>3</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>02 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => handleTenderClickFromDashboard("CPCL/2026/002")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/003</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Electrical Materials Supply</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>9</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>0</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>05 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#fff7ed", color: "#ea580c", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Closing Soon</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => handleTenderClickFromDashboard("CPCL/2026/003")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/004</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Maintenance Services</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>7</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>10 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => handleTenderClickFromDashboard("CPCL/2026/004")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#0f172a" }}>CPCL/2026/005</td>
                    <td style={{ padding: "12px 8px", color: "#334155" }}>Safety Equipment Supply</td>
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700 }}>11</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>2</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px 8px", color: "#64748b" }}>15 Sep 2026</td>
                    <td style={{ padding: "12px 8px" }}><span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 700 }}>Active</span></td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}><button onClick={() => handleTenderClickFromDashboard("CPCL/2026/005")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", fontSize: "0.78rem" }}>View</button></td>
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
                    <button onClick={() => handleTenderClickFromDashboard("CPCL/2026/001")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View</button>
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
                    <button onClick={() => handleTenderClickFromDashboard("CPCL/2026/002")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer" }}>View</button>
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

    const ALL_TENDERS = tendersList;

    const handleUpdateTenderStatus = (tenderId, newStatus) => {
      setPendingTenderAction({
        type: "STATUS",
        payload: { tenderId, newStatus },
        actionTitle: "Authorize Tender Status Update",
        description: `Change status of tender '${tenderId}' to '${newStatus}'. Authorization password required.`
      });
      setActiveTenderMenuId(null);
    };

    const handleDeleteTender = (tenderId) => {
      setPendingTenderAction({
        type: "DELETE",
        payload: { tenderId },
        actionTitle: "Authorize Tender Deletion",
        description: `Permanently delete tender '${tenderId}' from the platform. Authorization password required.`
      });
      setActiveTenderMenuId(null);
    };



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
                      <td style={{ padding: "14px 16px", textAlign: "right", position: "relative" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            title="View Bidders"
                            onClick={() => { setActiveTenderMenuId(null); setSelectedTenderForBidders(row); }}
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Edit Tender"
                            onClick={() => { setActiveTenderMenuId(null); setEditingTenderModalItem(row); }}
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            title="More Options"
                            onClick={(e) => { e.stopPropagation(); setActiveTenderMenuId(activeTenderMenuId === row.id ? null : row.id); }}
                            style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e2e8f0", background: activeTenderMenuId === row.id ? "#e2e8f0" : "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {/* More Options Dropdown Menu */}
                        {activeTenderMenuId === row.id && (
                          <div
                            style={{
                              position: "absolute",
                              right: "16px",
                              top: "46px",
                              zIndex: 100,
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                              minWidth: "180px",
                              padding: "6px 0",
                              textAlign: "left"
                            }}
                          >
                            <button
                              onClick={() => { setSelectedTenderForBidders(row); setActiveTenderMenuId(null); }}
                              style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155", cursor: "pointer", fontWeight: 600 }}
                            >
                              <Eye size={14} style={{ color: "#2563eb" }} /> View Bidders
                            </button>

                            <button
                              onClick={() => { setEditingTenderModalItem(row); setActiveTenderMenuId(null); }}
                              style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155", cursor: "pointer", fontWeight: 600 }}
                            >
                              <Pencil size={14} style={{ color: "#2563eb" }} /> Edit Details
                            </button>

                            <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }}></div>

                            <div style={{ padding: "4px 14px", fontSize: "0.68rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Change Status</div>

                            <button
                              onClick={() => handleUpdateTenderStatus(row.id, "Active")}
                              style={{ width: "100%", padding: "6px 14px", background: row.status === "Active" ? "#f0fdf4" : "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#16a34a", cursor: "pointer", fontWeight: 700 }}
                            >
                              🟢 Set to Active
                            </button>

                            <button
                              onClick={() => handleUpdateTenderStatus(row.id, "Closed")}
                              style={{ width: "100%", padding: "6px 14px", background: row.status === "Closed" ? "#f1f5f9" : "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#64748b", cursor: "pointer", fontWeight: 700 }}
                            >
                              ⚪ Set to Closed
                            </button>

                            <button
                              onClick={() => handleUpdateTenderStatus(row.id, "Cancelled")}
                              style={{ width: "100%", padding: "6px 14px", background: row.status === "Cancelled" ? "#fef2f2" : "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}
                            >
                              🔴 Set to Cancelled
                            </button>

                            <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0" }}></div>

                            <button
                              onClick={() => handleDeleteTender(row.id)}
                              style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}
                            >
                              🗑️ Delete Tender
                            </button>
                          </div>
                        )}
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

        {/* EDIT TENDER MODAL */}
        {editingTenderModalItem && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>Edit Tender Specifications</h2>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Tender ID: <strong>{editingTenderModalItem.id}</strong></span>
                </div>
                <button onClick={() => setEditingTenderModalItem(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", fontWeight: 800 }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Tender Title</label>
                  <input
                    type="text"
                    value={editingTenderModalItem.title}
                    onChange={(e) => setEditingTenderModalItem({ ...editingTenderModalItem, title: e.target.value })}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.88rem", color: "#0f172a" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Category</label>
                    <select
                      value={editingTenderModalItem.category}
                      onChange={(e) => setEditingTenderModalItem({ ...editingTenderModalItem, category: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a" }}
                    >
                      <option value="Equipment">Equipment</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Services">Services</option>
                      <option value="Safety">Safety</option>
                      <option value="General">General</option>
                      <option value="Works">Works</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Department</label>
                    <select
                      value={editingTenderModalItem.department}
                      onChange={(e) => setEditingTenderModalItem({ ...editingTenderModalItem, department: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a" }}
                    >
                      <option value="Projects">Projects</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Operations">Operations</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Closing Date</label>
                    <input
                      type="text"
                      value={editingTenderModalItem.closingDate}
                      onChange={(e) => setEditingTenderModalItem({ ...editingTenderModalItem, closingDate: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Status</label>
                    <select
                      value={editingTenderModalItem.status}
                      onChange={(e) => setEditingTenderModalItem({ ...editingTenderModalItem, status: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <button
                    onClick={() => setEditingTenderModalItem(null)}
                    style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setPendingTenderAction({
                        type: "EDIT",
                        payload: { editedTender: editingTenderModalItem },
                        actionTitle: "Authorize Tender Modification",
                        description: `Save updates for tender '${editingTenderModalItem.id}'. Authorization password required.`
                      });
                    }}
                    style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
    const [activeBidderMenuId, setActiveBidderMenuId] = useState(null);
    const [viewingBidderDetails, setViewingBidderDetails] = useState(null);
    const [biddersActionToast, setBiddersActionToast] = useState("");

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
                    <td style={{ padding: "14px 16px", textAlign: "right", position: "relative" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          title="View Complete Bidder Profile"
                          onClick={() => {
                            setActiveBidderMenuId(null);
                            setViewingBidderDetails(b);
                          }}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Inspect Documents & Verify"
                          onClick={() => {
                            setActiveBidderMenuId(null);
                            setSelectedTenderForBidders(null);
                            setSelectedVerificationBidder(b);
                            setActiveSection("verification");
                          }}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <FileText size={15} />
                        </button>
                        <div style={{ position: "relative" }}>
                          <button
                            title="More Options"
                            onClick={() => setActiveBidderMenuId(activeBidderMenuId === b.id ? null : b.id)}
                            style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: activeBidderMenuId === b.id ? "#eff6ff" : "#ffffff", color: activeBidderMenuId === b.id ? "#2563eb" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <MoreVertical size={15} />
                          </button>

                          {/* FLOATING ACTIONS DROPDOWN MENU */}
                          {activeBidderMenuId === b.id && (
                            <div style={{ position: "absolute", right: 0, top: "36px", zIndex: 999, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", width: "210px", padding: "6px 0", textAlign: "left" }}>
                              <button
                                onClick={() => {
                                  setActiveBidderMenuId(null);
                                  setViewingBidderDetails(b);
                                }}
                                style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                              >
                                <Eye size={14} style={{ color: "#2563eb" }} /> View Full Profile
                              </button>
                              <button
                                onClick={() => {
                                  setActiveBidderMenuId(null);
                                  setSelectedTenderForBidders(null);
                                  setSelectedVerificationBidder(b);
                                  setActiveSection("verification");
                                }}
                                style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                              >
                                <FileText size={14} style={{ color: "#16a34a" }} /> Inspect & Verify Bids
                              </button>
                              <button
                                onClick={() => {
                                  setActiveBidderMenuId(null);
                                  setBiddersActionToast(`Official compliance summary generated for ${b.name}`);
                                  setTimeout(() => setBiddersActionToast(""), 4000);
                                }}
                                style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                              >
                                <CheckCircle2 size={14} style={{ color: "#0284c7" }} /> Compliance Summary
                              </button>
                              <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
                              <button
                                onClick={() => {
                                  setActiveBidderMenuId(null);
                                  setBiddersActionToast(`Official notice dispatched to ${b.email}`);
                                  setTimeout(() => setBiddersActionToast(""), 4000);
                                }}
                                style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", color: "#0f172a", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                              >
                                <Mail size={14} style={{ color: "#9333ea" }} /> Send Official Email
                              </button>
                            </div>
                          )}
                        </div>
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

        {/* BIDDER PROFILE & CREDENTIALS MODAL */}
        {viewingBidderDetails && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", border: "1px solid #bfdbfe" }}>
                    {viewingBidderDetails.initials}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>{viewingBidderDetails.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>ID: {viewingBidderDetails.id}</span>
                      <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800, background: viewingBidderDetails.statusBadgeBg, color: viewingBidderDetails.statusBadgeColor }}>
                        ● {viewingBidderDetails.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewingBidderDetails(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", fontWeight: 800 }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>COMPLIANCE SCORE</span>
                    <strong style={{ fontSize: "1.2rem", color: viewingBidderDetails.scoreColor }}>
                      {viewingBidderDetails.complianceScore !== null ? `${viewingBidderDetails.complianceScore}%` : "N/A"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>RISK LEVEL</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: viewingBidderDetails.riskColor }}>
                      {viewingBidderDetails.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>ACTIVE TENDERS</span>
                    <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>
                      {viewingBidderDetails.activeTenders} Bids
                    </strong>
                  </div>
                </div>

                {/* Registration Details */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Statutory & Legal Identifiers</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.82rem" }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>PAN Number</span>
                      <strong style={{ color: "#0f172a" }}>{viewingBidderDetails.pan}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>GSTIN Identifier</span>
                      <strong style={{ color: "#0f172a" }}>{viewingBidderDetails.gstin}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>Entity Type</span>
                      <span style={{ color: "#334155", fontWeight: 600 }}>{viewingBidderDetails.type}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>Verification Date</span>
                      <span style={{ color: "#334155", fontWeight: 600 }}>{viewingBidderDetails.verificationDate || "Pending Verification"}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Registered Contact Information</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem", color: "#334155" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Phone size={14} style={{ color: "#2563eb" }} /> <span>{viewingBidderDetails.phone}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Mail size={14} style={{ color: "#2563eb" }} /> <span>{viewingBidderDetails.email}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MapPin size={14} style={{ color: "#2563eb" }} /> <span>{viewingBidderDetails.location}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    onClick={() => setViewingBidderDetails(null)}
                    style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 18px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const bidderToVerify = viewingBidderDetails;
                      setViewingBidderDetails(null);
                      setSelectedTenderForBidders(null);
                      setSelectedVerificationBidder(bidderToVerify);
                      setActiveSection("verification");
                    }}
                    style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 22px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.25)", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <ShieldCheck size={16} /> Inspect Documents & Verify
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ACTION TOAST NOTIFICATION */}
        {biddersActionToast && (
          <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999, background: "#0f172a", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
            <span>{biddersActionToast}</span>
          </div>
        )}      </div>
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

  // Admin "User Management" View Component
  const UserManagementView = () => {
    const initialUsers = [
      {
        id: "USR-1001",
        name: "Admin SuperUser",
        email: "admin@gem.gov.in",
        phone: "+91 98765 43210",
        role: "Super Admin",
        department: "System Administration",
        status: "Active",
        lastLogin: "30 Aug 2026, 14:52 IST",
        permissions: [
          "Manage Users",
          "Manage Tenders",
          "Verify Documents",
          "View Reports",
          "Approve Bids",
          "Manage Rules",
          "View Audit Trail",
          "Manage Integrations"
        ]
      },
      {
        id: "USR-1002",
        name: "Procurement Officer Rajesh Kumar",
        email: "rajesh.kumar@gem.gov.in",
        phone: "+91 98123 45678",
        role: "Procurement Officer",
        department: "Procurement",
        status: "Active",
        lastLogin: "30 Aug 2026, 13:10 IST",
        permissions: [
          "Manage Tenders",
          "Verify Documents",
          "View Reports",
          "Approve Bids",
          "View Audit Trail"
        ]
      },
      {
        id: "USR-1003",
        name: "Priya Sharma",
        email: "priya.sharma@gem.gov.in",
        phone: "+91 97654 32109",
        role: "Verification Officer",
        department: "Verification & Audit",
        status: "Active",
        lastLogin: "30 Aug 2026, 11:24 IST",
        permissions: [
          "Verify Documents",
          "View Reports",
          "View Audit Trail"
        ]
      },
      {
        id: "USR-1004",
        name: "Dr. Shashi Kumar",
        email: "shashi.kumar@gem.gov.in",
        phone: "+91 96543 21098",
        role: "Auditor",
        department: "Legal & Compliance",
        status: "Active",
        lastLogin: "29 Aug 2026, 16:40 IST",
        permissions: [
          "View Reports",
          "View Audit Trail"
        ]
      },
      {
        id: "USR-1005",
        name: "Vikram Singh",
        email: "vikram.singh@gem.gov.in",
        phone: "+91 95432 10987",
        role: "Procurement Officer",
        department: "Procurement",
        status: "Pending",
        lastLogin: "Never logged in",
        permissions: [
          "Manage Tenders",
          "Verify Documents",
          "View Reports"
        ]
      },
      {
        id: "USR-1006",
        name: "Ananya Roy",
        email: "ananya.roy@gem.gov.in",
        phone: "+91 94321 09876",
        role: "Verification Officer",
        department: "Verification & Audit",
        status: "Suspended",
        lastLogin: "15 Aug 2026, 09:15 IST",
        permissions: [
          "Verify Documents",
          "View Reports"
        ]
      }
    ];

    const allAvailablePermissions = [
      "Manage Users",
      "Manage Tenders",
      "Verify Documents",
      "View Reports",
      "Approve Bids",
      "Manage Rules",
      "View Audit Trail",
      "Manage Integrations"
    ];

    const [usersList, setUsersList] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [deptFilter, setDeptFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");

    // Modal & Dialog States
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
      isOpen: false,
      title: "",
      message: "",
      actionType: "",
      targetUser: null
    });

    const [userForm, setUserForm] = useState({
      name: "",
      email: "",
      phone: "",
      department: "Procurement",
      role: "Procurement Officer",
      status: "Active",
      password: "",
      confirmPassword: "",
      adminAuthorizationPassword: "",
      permissions: ["Manage Tenders", "Verify Documents", "View Reports", "Approve Bids", "View Audit Trail"]
    });

    // Reset filters
    const handleResetFilters = () => {
      setSearchQuery("");
      setRoleFilter("All");
      setDeptFilter("All");
      setStatusFilter("All");
    };

    // Open Modal for Add User
    const handleOpenAddModal = () => {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        department: "Procurement",
        role: "Procurement Officer",
        status: "Active",
        password: "",
        confirmPassword: "",
        adminAuthorizationPassword: "",
        permissions: ["Manage Tenders", "Verify Documents", "View Reports", "Approve Bids", "View Audit Trail"]
      });
      setIsAddEditModalOpen(true);
    };

    // Open Modal for Edit User
    const handleOpenEditModal = (u) => {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        email: u.email,
        phone: u.phone,
        department: u.department,
        role: u.role,
        status: u.status,
        password: "",
        confirmPassword: "",
        adminAuthorizationPassword: "",
        permissions: [...(u.permissions || [])]
      });
      setIsAddEditModalOpen(true);
    };

    // Auto-update permissions when role changes in form
    const handleRoleChangeInForm = (newRole) => {
      let defaultPerms = [];
      if (newRole === "Super Admin") {
        defaultPerms = [...allAvailablePermissions];
      } else if (newRole === "Procurement Officer") {
        defaultPerms = ["Manage Tenders", "Verify Documents", "View Reports", "Approve Bids", "View Audit Trail"];
      } else if (newRole === "Verification Officer") {
        defaultPerms = ["Verify Documents", "View Reports", "View Audit Trail"];
      } else if (newRole === "Auditor") {
        defaultPerms = ["View Reports", "View Audit Trail"];
      }
      setUserForm((prev) => ({ ...prev, role: newRole, permissions: defaultPerms }));
    };

    // Toggle Permission Checkbox
    const handlePermissionToggle = (perm) => {
      setUserForm((prev) => {
        const has = prev.permissions.includes(perm);
        const updated = has
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm];
        return { ...prev, permissions: updated };
      });
    };

    // Save Add/Edit User Form
    const handleSaveUser = (e) => {
      e.preventDefault();
      if (!userForm.name || !userForm.email) {
        alert("Please provide Full Name and Email Address.");
        return;
      }

      if (!editingUser) {
        if (!userForm.password) {
          alert("Please enter an Account Password for the new user.");
          return;
        }
        if (userForm.password !== userForm.confirmPassword) {
          alert("Account Password and Confirm Password do not match.");
          return;
        }
        if (!userForm.adminAuthorizationPassword) {
          alert("Admin Authorization Required: Please enter your Admin Password to create this user account.");
          return;
        }
      }

      if (editingUser) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u))
        );
        alert(`User '${userForm.name}' updated successfully!`);
      } else {
        const newUserObj = {
          id: `USR-${1000 + usersList.length + 1}`,
          ...userForm,
          role: "Procurement Officer", // Fixed to Procurement Officer for newly created accounts
          lastLogin: "Never logged in"
        };
        setUsersList((prev) => [newUserObj, ...prev]);
        alert(`User '${userForm.name}' created successfully as Procurement Officer!`);
      }
      setIsAddEditModalOpen(false);
    };

    // Action Triggers for Confirmation Dialogs
    const triggerConfirmDialog = (type, u) => {
      if (type === "SUSPEND") {
        const isCurrentlySuspended = u.status === "Suspended";
        setConfirmDialog({
          isOpen: true,
          title: isCurrentlySuspended ? "Reactivate User Account" : "Suspend User Account",
          message: isCurrentlySuspended
            ? `Are you sure you want to reactivate access for ${u.name} (${u.email})?`
            : `Are you sure you want to suspend user account for ${u.name} (${u.email})? They will lose access to the portal immediately.`,
          actionType: type,
          targetUser: u
        });
      } else if (type === "RESET_PASSWORD") {
        setConfirmDialog({
          isOpen: true,
          title: "Reset User Password",
          message: `Send an official secure password reset link to ${u.name} at '${u.email}'?`,
          actionType: type,
          targetUser: u
        });
      } else if (type === "DELETE") {
        setConfirmDialog({
          isOpen: true,
          title: "Delete User Account",
          message: `Are you sure you want to permanently delete user ${u.name} (${u.id})? This action cannot be undone.`,
          actionType: type,
          targetUser: u
        });
      }
    };

    // Confirm Dialog Action Handler
    const handleConfirmAction = () => {
      const { actionType, targetUser } = confirmDialog;
      if (!targetUser) return;

      if (actionType === "SUSPEND") {
        const newStatus = targetUser.status === "Suspended" ? "Active" : "Suspended";
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
        );
        alert(`User ${targetUser.name} has been ${newStatus === "Suspended" ? "suspended" : "reactivated"}.`);
      } else if (actionType === "RESET_PASSWORD") {
        alert(`Password reset link successfully dispatched to ${targetUser.email}.`);
      } else if (actionType === "DELETE") {
        setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
        alert(`User account ${targetUser.name} deleted permanently.`);
      }

      setConfirmDialog({ isOpen: false, title: "", message: "", actionType: "", targetUser: null });
    };

    // Filter Logic
    const filteredUsers = usersList.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesDept = deptFilter === "All" || u.department === deptFilter;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });

    // KPI Metrics
    const totalUsersCount = usersList.length;
    const activeUsersCount = usersList.filter((u) => u.status === "Active").length;
    const pendingUsersCount = usersList.filter((u) => u.status === "Pending").length;
    const adminUsersCount = usersList.filter((u) => u.role === "Super Admin").length;

    // Helper for Status Badges
    const getStatusBadge = (st) => {
      switch (st) {
        case "Active":
          return <span style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>🟢 Active</span>;
        case "Pending":
          return <span style={{ background: "#fef9c3", color: "#a16207", border: "1px solid #fef08a", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>🟡 Pending</span>;
        case "Suspended":
          return <span style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>🔴 Suspended</span>;
        default:
          return <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600 }}>{st}</span>;
      }
    };

    // Helper for Role Badges
    const getRoleBadge = (r) => {
      switch (r) {
        case "Super Admin":
          return <span style={{ background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>Super Admin</span>;
        case "Procurement Officer":
          return <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>Procurement Officer</span>;
        case "Verification Officer":
          return <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>Verification Officer</span>;
        case "Auditor":
          return <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700 }}>Auditor</span>;
        default:
          return <span style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px", fontSize: "0.78rem" }}>{r}</span>;
      }
    };

    const matrixRoles = ["Super Admin", "Procurement Officer", "Verification Officer", "Auditor"];
    const checkMatrixPermission = (roleName, perm) => {
      if (roleName === "Super Admin") return true;
      if (roleName === "Procurement Officer") {
        return ["Manage Tenders", "Verify Documents", "View Reports", "Approve Bids", "View Audit Trail"].includes(perm);
      }
      if (roleName === "Verification Officer") {
        return ["Verify Documents", "View Reports", "View Audit Trail"].includes(perm);
      }
      if (roleName === "Auditor") {
        return ["View Reports", "View Audit Trail"].includes(perm);
      }
      return false;
    };

    return (
      <div className="reports-view-container" style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

        {/* MAIN HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={28} style={{ color: "#1e3a8a" }} />
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                USER MANAGEMENT
              </h1>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "4px 0 0 0" }}>
              Manage administrators, procurement officers, verification officers and auditors.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            style={{
              background: "#1e3a8a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.25)"
            }}
          >
            <Plus size={18} /> + Add User
          </button>
        </div>

        {/* TOP KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Users</span>
              <Users size={20} style={{ color: "#2563eb" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", marginTop: "8px" }}>{totalUsersCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>All managed platform accounts</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Users</span>
              <UserCheck size={20} style={{ color: "#16a34a" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#15803d", marginTop: "8px" }}>{activeUsersCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>🟢 Active system credentials</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pending Invitations</span>
              <Clock size={20} style={{ color: "#d97706" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#b45309", marginTop: "8px" }}>{pendingUsersCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#b45309" }}>🟡 Awaiting onboarding response</span>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Administrators</span>
              <Shield size={20} style={{ color: "#9333ea" }} />
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#7e22ce", marginTop: "8px" }}>{adminUsersCount}</div>
            <span style={{ fontSize: "0.75rem", color: "#7e22ce" }}>Super Admin root privilege</span>
          </div>
        </div>

        {/* SEARCH & FILTERS TOOLBAR */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search user by name, email, department or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none"
                }}
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
            >
              <option value="All" style={{ background: "#ffffff", color: "#0f172a" }}>All Roles</option>
              <option value="Super Admin" style={{ background: "#ffffff", color: "#0f172a" }}>Super Admin</option>
              <option value="Procurement Officer" style={{ background: "#ffffff", color: "#0f172a" }}>Procurement Officer</option>
              <option value="Verification Officer" style={{ background: "#ffffff", color: "#0f172a" }}>Verification Officer</option>
              <option value="Auditor" style={{ background: "#ffffff", color: "#0f172a" }}>Auditor</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
            >
              <option value="All" style={{ background: "#ffffff", color: "#0f172a" }}>All Departments</option>
              <option value="System Administration" style={{ background: "#ffffff", color: "#0f172a" }}>System Administration</option>
              <option value="Procurement" style={{ background: "#ffffff", color: "#0f172a" }}>Procurement</option>
              <option value="Verification & Audit" style={{ background: "#ffffff", color: "#0f172a" }}>Verification & Audit</option>
              <option value="Legal & Compliance" style={{ background: "#ffffff", color: "#0f172a" }}>Legal & Compliance</option>
              <option value="Finance" style={{ background: "#ffffff", color: "#0f172a" }}>Finance</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
            >
              <option value="All" style={{ background: "#ffffff", color: "#0f172a" }}>All Statuses</option>
              <option value="Active" style={{ background: "#ffffff", color: "#0f172a" }}>🟢 Active</option>
              <option value="Pending" style={{ background: "#ffffff", color: "#0f172a" }}>🟡 Pending</option>
              <option value="Suspended" style={{ background: "#ffffff", color: "#0f172a" }}>🔴 Suspended</option>
            </select>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              style={{
                padding: "9px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* DETAILED USER TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Name & ID</th>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Email</th>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Role</th>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Department</th>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Status</th>
                <th style={{ padding: "14px 18px", color: "#475569" }}>Last Login</th>
                <th style={{ padding: "14px 18px", textAlign: "right", color: "#475569" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b", background: "#ffffff" }}>
                    No user accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: "#ffffff" }}>

                    {/* Name & Avatar */}
                    <td style={{ padding: "14px 18px", color: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: u.role === "Super Admin" ? "#9333ea" : u.role === "Procurement Officer" ? "#2563eb" : "#16a34a",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.82rem"
                        }}>
                          {u.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "14px 18px", color: "#334155" }}>
                      {u.email}
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 18px", color: "#0f172a" }}>
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Department */}
                    <td style={{ padding: "14px 18px", color: "#475569", fontWeight: 600 }}>
                      {u.department}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 18px" }}>
                      {getStatusBadge(u.status)}
                    </td>

                    {/* Last Login */}
                    <td style={{ padding: "14px 18px", color: "#64748b", fontSize: "0.8rem" }}>
                      {u.lastLogin}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>

                        {/* View Button */}
                        <button
                          onClick={() => setViewingUser(u)}
                          title="View User Details"
                          style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "6px 9px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={14} /> View
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title="Edit User"
                          style={{ background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", padding: "6px 9px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        {/* Suspend / Reactivate Button */}
                        <button
                          onClick={() => triggerConfirmDialog("SUSPEND", u)}
                          title={u.status === "Suspended" ? "Reactivate User" : "Suspend User"}
                          style={{
                            background: u.status === "Suspended" ? "#dcfce7" : "#fef2f2",
                            color: u.status === "Suspended" ? "#16a34a" : "#dc2626",
                            border: u.status === "Suspended" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                            padding: "6px 9px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: 700
                          }}
                        >
                          {u.status === "Suspended" ? "Reactivate" : "Suspend"}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => triggerConfirmDialog("RESET_PASSWORD", u)}
                          title="Reset Password"
                          style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", padding: "6px 9px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          <Key size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => triggerConfirmDialog("DELETE", u)}
                          title="Delete User Account"
                          style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", padding: "6px 9px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ROLE & PERMISSIONS MATRIX SECTION */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              ROLE & PERMISSIONS MATRIX
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0 0" }}>
              Standard feature access rules automatically configured for each administrative role level.
            </p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Feature / Permission</th>
                {matrixRoles.map((r) => (
                  <th key={r} style={{ padding: "12px 16px", textAlign: "center" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allAvailablePermissions.map((perm) => (
                <tr key={perm} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>
                    {perm}
                  </td>
                  {matrixRoles.map((roleName) => {
                    const isAllowed = checkMatrixPermission(roleName, perm);
                    return (
                      <td key={roleName} style={{ padding: "12px 16px", textAlign: "center" }}>
                        {isAllowed ? (
                          <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 800 }}>
                            ✓ Allowed
                          </span>
                        ) : (
                          <span style={{ background: "#f1f5f9", color: "#94a3b8", padding: "4px 12px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                            ✕ Restricted
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD / EDIT USER MODAL */}
        {isAddEditModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "620px", maxWidth: "90%", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  {editingUser ? `Edit User: ${editingUser.name}` : "Add New User Account"}
                </h3>
                <button onClick={() => setIsAddEditModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="user@gem.gov.in"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Department</label>
                    <select
                      value={userForm.department}
                      onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                    >
                      <option value="Procurement" style={{ background: "#ffffff", color: "#0f172a" }}>Procurement</option>
                      <option value="Verification & Audit" style={{ background: "#ffffff", color: "#0f172a" }}>Verification & Audit</option>
                      <option value="Legal & Compliance" style={{ background: "#ffffff", color: "#0f172a" }}>Legal & Compliance</option>
                      <option value="System Administration" style={{ background: "#ffffff", color: "#0f172a" }}>System Administration</option>
                      <option value="Finance" style={{ background: "#ffffff", color: "#0f172a" }}>Finance</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>User Role *</label>
                    <select
                      value="Procurement Officer"
                      disabled
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#f1f5f9", cursor: "not-allowed" }}
                    >
                      <option value="Procurement Officer">Procurement Officer</option>
                    </select>
                    <small style={{ fontSize: "0.72rem", color: "#64748b", display: "block", marginTop: "2px" }}>Locked: New user accounts are created as Procurement Officer</small>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Account Status</label>
                    <select
                      value={userForm.status}
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                    >
                      <option value="Active" style={{ background: "#ffffff", color: "#0f172a" }}>🟢 Active</option>
                      <option value="Pending" style={{ background: "#ffffff", color: "#0f172a" }}>🟡 Pending</option>
                      <option value="Suspended" style={{ background: "#ffffff", color: "#0f172a" }}>🔴 Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Password Setting & Admin Authorization for New Account */}
                {!editingUser && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Set Account Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Enter user password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Confirm Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={userForm.confirmPassword}
                          onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "20px", background: "#fff7ed", padding: "12px 16px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#c2410c", marginBottom: "4px" }}>
                        🔑 Admin Authorization Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter Admin Password to authorize account creation"
                        value={userForm.adminAuthorizationPassword}
                        onChange={(e) => setUserForm({ ...userForm, adminAuthorizationPassword: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fed7aa", fontSize: "0.85rem", color: "#0f172a", background: "#ffffff" }}
                      />
                      <small style={{ fontSize: "0.72rem", color: "#9a3412", display: "block", marginTop: "4px" }}>
                        Admin credentials validation required to create new Procurement Officer accounts.
                      </small>
                    </div>
                  </>
                )}

                {/* Permissions Checklist */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                    Assigned System Permissions
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    {allAvailablePermissions.map((perm) => (
                      <label key={perm} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#334155", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={userForm.permissions.includes(perm)}
                          onChange={() => handlePermissionToggle(perm)}
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    style={{ padding: "9px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "9px 20px", borderRadius: "6px", border: "none", background: "#1e3a8a", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                  >
                    {editingUser ? "Save Changes" : "Create Account"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* VIEW USER DETAILS MODAL */}
        {viewingUser && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "520px", maxWidth: "90%", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  User Account Inspector
                </h3>
                <button onClick={() => setViewingUser(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}>✕</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", background: "#f8fafc", padding: "16px", borderRadius: "10px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: viewingUser.role === "Super Admin" ? "#9333ea" : "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "1.1rem"
                }}>
                  {viewingUser.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{viewingUser.name}</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>{viewingUser.email} • {viewingUser.phone}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", fontSize: "0.83rem" }}>
                <div><strong>User ID:</strong> {viewingUser.id}</div>
                <div><strong>Role:</strong> {viewingUser.role}</div>
                <div><strong>Department:</strong> {viewingUser.department}</div>
                <div><strong>Status:</strong> {viewingUser.status}</div>
                <div><strong>Last Login:</strong> {viewingUser.lastLogin}</div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <strong style={{ display: "block", fontSize: "0.82rem", color: "#0f172a", marginBottom: "8px" }}>Granted Permissions:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(viewingUser.permissions || []).map((p) => (
                    <span key={p} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => setViewingUser(null)}
                  style={{ padding: "8px 16px", borderRadius: "6px", background: "#0f172a", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" }}
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG MODAL */}
        {confirmDialog.isOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "450px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)", borderTop: "4px solid #dc2626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <AlertTriangle size={24} style={{ color: "#dc2626" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  {confirmDialog.title}
                </h3>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, title: "", message: "", actionType: "", targetUser: null })}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: confirmDialog.actionType === "DELETE" ? "#dc2626" : confirmDialog.actionType === "SUSPEND" ? "#b91c1c" : "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };


  const AuditTrailView = () => {
    const initialAuditLogs = [
      {
        id: "AUD-2026-90412",
        timestamp: "30 Aug 2026, 14:32:10 IST",
        date: "2026-08-30",
        user: "Procurement Officer Rajesh Kumar",
        userId: "OFF-8821",
        role: "OFFICER",
        action: "Procurement Officer approved bid",
        actionType: "Procurement Officer approved bid",
        bidder: "Acme Tech Solutions Private Limited",
        tender: "GEM-CPCL-2026-001",
        status: "Success",
        details: "Bid GEM-CPCL-2026-001 officially approved and marked as Qualified after compliance review.",
        previousValue: "STATUS: UNDER_REVIEW | SCORE: 55% | RISK: MEDIUM",
        newValue: "STATUS: QUALIFIED / APPROVED | SCORE: 95% | RISK: LOW",
        source: "GeM Officer Console v3.4",
        evidence: "GSTIN Active (27AAPCS1234M1Z5), CBDT PAN Match 100%, Udyam MSME valid through 2028.",
        ipDevice: "192.168.1.104 | Chrome 128.0 (Win 11) | New Delhi HQ Admin Terminal"
      },
      {
        id: "AUD-2026-90411",
        timestamp: "30 Aug 2026, 14:15:04 IST",
        date: "2026-08-30",
        user: "AI Verification Engine",
        userId: "AI-SYS-01",
        role: "AI_ENGINE",
        action: "Compliance score generated",
        actionType: "Compliance score generated",
        bidder: "Acme Tech Solutions Private Limited",
        tender: "GEM-CPCL-2026-001",
        status: "Success",
        details: "Final compliance score computed at 95/100 based on zero registry mismatches.",
        previousValue: "SCORE: COMPUTING...",
        newValue: "SCORE: 95/100 | RATING: EXCELLENT",
        source: "GeM Scoring Engine v2.1",
        evidence: "Automated scoring rules evaluated: GST +30, PAN +30, MSME +20, OEM +15.",
        ipDevice: "10.0.4.12 | Microservice Worker Node #4 | MeitY Cloud Sandbox"
      },
      {
        id: "AUD-2026-90410",
        timestamp: "30 Aug 2026, 14:14:48 IST",
        date: "2026-08-30",
        user: "AI Verification Engine",
        userId: "AI-SYS-01",
        role: "AI_ENGINE",
        action: "AI risk calculated",
        actionType: "AI risk calculated",
        bidder: "Global Traders Inc",
        tender: "GEM-CPCL-2026-002",
        status: "Flagged",
        details: "Risk rating calculated as MEDIUM (55/100) due to suspended GSTIN status penalty.",
        previousValue: "RISK: UNASSESSED",
        newValue: "RISK: MEDIUM (-10 pts penalty for GSTIN suspension)",
        source: "AI Risk Assessment Neural Model",
        evidence: "GSTN API returned status 'Suspended' for GSTIN 22AAAAA1111A1Z1.",
        ipDevice: "10.0.4.15 | AI Risk Calculation Cluster | MeitY Cloud"
      },
      {
        id: "AUD-2026-90409",
        timestamp: "30 Aug 2026, 13:58:22 IST",
        date: "2026-08-30",
        user: "Procurement Officer Rajesh Kumar",
        userId: "OFF-8821",
        role: "OFFICER",
        action: "Bid sent for manual review",
        actionType: "Bid sent for manual review",
        bidder: "Vanguard Systems Ltd",
        tender: "GEM-CPCL-2026-003",
        status: "Review",
        details: "Bid flagged and escalated to senior auditor due to standalone PAN owner name mismatch.",
        previousValue: "STATUS: PENDING_AI_CHECK",
        newValue: "STATUS: ESCALATED_TO_AUDITOR",
        source: "GeM Audit Workflow Dispatcher",
        evidence: "GSTIN registrant ('Vanguard Systems Ltd') differs from PAN owner ('Vanguard Director').",
        ipDevice: "192.168.1.104 | Firefox 129.0 (Win 11) | New Delhi HQ"
      },
      {
        id: "AUD-2026-90408",
        timestamp: "30 Aug 2026, 13:42:15 IST",
        date: "2026-08-30",
        user: "System Security Service",
        userId: "SYS-SEC-09",
        role: "SYSTEM",
        action: "GST checked",
        actionType: "GST checked",
        bidder: "Acme Tech Solutions Private Limited",
        tender: "GEM-CPCL-2026-001",
        status: "Success",
        details: "GSTN API query returned 200 OK. Status: Active. Taxpayer Type: Regular.",
        previousValue: "GSTIN: UNVERIFIED",
        newValue: "GSTIN: 27AAPCS1234M1Z5 (ACTIVE - Regular)",
        source: "Government GSTN Integration Gateway",
        evidence: "https://api.gst.gov.in/taxpayer/v1/search endpoint payload token response #88921",
        ipDevice: "10.0.12.8 | Integration Gateway Server #1"
      },
      {
        id: "AUD-2026-90407",
        timestamp: "30 Aug 2026, 13:40:02 IST",
        date: "2026-08-30",
        user: "System Security Service",
        userId: "SYS-SEC-09",
        role: "SYSTEM",
        action: "PAN checked",
        actionType: "PAN checked",
        bidder: "Acme Tech Solutions Private Limited",
        tender: "GEM-CPCL-2026-001",
        status: "Success",
        details: "CBDT PAN verification succeeded. PAN AAPCS1234M matched legal entity name.",
        previousValue: "PAN: UNVERIFIED",
        newValue: "PAN: AAPCS1234M (MATCHED 100%)",
        source: "CBDT Income Tax PAN Validation Service",
        evidence: "https://incometaxindia.gov.in/api/v2/pan-val 200 OK payload digest",
        ipDevice: "10.0.12.8 | Integration Gateway Server #1"
      },
      {
        id: "AUD-2026-90406",
        timestamp: "30 Aug 2026, 13:30:19 IST",
        date: "2026-08-30",
        user: "AI Verification Engine",
        userId: "AI-SYS-01",
        role: "AI_ENGINE",
        action: "Document verified",
        actionType: "Document verified",
        bidder: "Global Traders Inc",
        tender: "GEM-CPCL-2026-002",
        status: "Success",
        details: "Smart PDF OCR parsed MSME Certificate UDYAM-DL-01-0098765. Digital signature valid.",
        previousValue: "DOCUMENT_STATUS: UNPARSED",
        newValue: "DOCUMENT_STATUS: PARSED_AND_VERIFIED",
        source: "SmartPDF OCR & Vision Parser",
        evidence: "Signature SHA256 matches MSME Root CA public certificate.",
        ipDevice: "10.0.4.14 | Document Parser Service Worker"
      },
      {
        id: "AUD-2026-90405",
        timestamp: "30 Aug 2026, 13:10:00 IST",
        date: "2026-08-30",
        user: "Admin SuperUser",
        userId: "ADM-0001",
        role: "ADMIN",
        action: "Rule updated",
        actionType: "Rule updated",
        bidder: "N/A (Global System Rule)",
        tender: "N/A (All Tenders)",
        status: "Success",
        details: "Updated mandatory threshold rule: MSME Turnover exemption buffer set to 15%.",
        previousValue: "RULE_PARAM: turnover_buffer = 10%",
        newValue: "RULE_PARAM: turnover_buffer = 15%",
        source: "Admin Compliance Policy Configurator",
        evidence: "Signed with Admin Cryptographic Security Token #ADM-771",
        ipDevice: "192.168.1.100 | Admin Workstation | Secunderabad HQ"
      },
      {
        id: "AUD-2026-90404",
        timestamp: "30 Aug 2026, 12:45:11 IST",
        date: "2026-08-30",
        user: "Supplier Account User",
        userId: "SUP-4019",
        role: "BIDDER",
        action: "Bid uploaded",
        actionType: "Bid uploaded",
        bidder: "Acme Tech Solutions Private Limited",
        tender: "GEM-CPCL-2026-001",
        status: "Success",
        details: "Bid packet uploaded containing 10 compliance PDF documents (Total size: 14.2 MB).",
        previousValue: "N/A (New Submission)",
        newValue: "PACKET_HASH: 9a8f27b4e13c85d6 (Uploaded)",
        source: "GeM Supplier Portal Upload Gateway",
        evidence: "Multi-part upload complete. Encrypted payload stored in Secure Vault S3.",
        ipDevice: "49.207.142.18 | Chrome 127.0 (Win 11) | Mumbai Regional Office"
      },
      {
        id: "AUD-2026-90403",
        timestamp: "30 Aug 2026, 11:20:00 IST",
        date: "2026-08-30",
        user: "Admin SuperUser",
        userId: "ADM-0001",
        role: "ADMIN",
        action: "User account created",
        actionType: "User account created",
        bidder: "TechVision Solutions Ltd",
        tender: "N/A",
        status: "Success",
        details: "Created new verified bidder account for TechVision Solutions Ltd (AABCT8901H).",
        previousValue: "USER_ACCOUNT: NON_EXISTENT",
        newValue: "USER_ACCOUNT: CREATED (ROLE: BIDDER)",
        source: "User Provisioning System",
        evidence: "OTP & Email verification completed. Mandatory KYC documents attached.",
        ipDevice: "192.168.1.100 | Admin Console | Secunderabad HQ"
      },
      {
        id: "AUD-2026-90402",
        timestamp: "29 Aug 2026, 16:04:12 IST",
        date: "2026-08-29",
        user: "AI Verification Engine",
        userId: "AI-SYS-01",
        role: "AI_ENGINE",
        action: "Document verified",
        actionType: "Document verified",
        bidder: "ABC Engineering Pvt. Ltd.",
        tender: "GEM-CPCL-001",
        status: "Success",
        details: "Verified ISO 9001:2015 Quality Certificate authenticity via NABCB directory.",
        previousValue: "CERTIFICATE_STATUS: PENDING",
        newValue: "CERTIFICATE_STATUS: VERIFIED_VALID",
        source: "Automated Certificate Authenticator",
        evidence: "NABCB Accreditation Registry Match ID #ISO-9901-2026",
        ipDevice: "10.0.4.12 | Cloud Worker Node #2"
      },
      {
        id: "AUD-2026-90401",
        timestamp: "29 Aug 2026, 15:10:44 IST",
        date: "2026-08-29",
        user: "System Security Service",
        userId: "SYS-SEC-09",
        role: "SYSTEM",
        action: "GST checked",
        actionType: "GST checked",
        bidder: "XYZ Industries Pvt. Ltd.",
        tender: "GEM-CPCL-001",
        status: "Failed",
        details: "GSTN API returned 504 Gateway Timeout during automated taxpayer query.",
        previousValue: "QUERY_STATUS: IN_PROGRESS",
        newValue: "QUERY_STATUS: FAILED_504_TIMEOUT (Retry scheduled)",
        source: "GSTN Gateway Proxy Engine",
        evidence: "HTTP 504 Gateway Timeout from GSTN Portal IP 164.100.x.x",
        ipDevice: "10.0.12.8 | Gateway Node #1"
      }
    ];

    // Generate dynamic audit logs from bids state in real-time
    const dynamicBidLogs = bids.flatMap((b) =>
      (b.logs || []).map((logText, idx) => {
        let status = "Success";
        if (logText.toLowerCase().includes("warning") || logText.toLowerCase().includes("penalty") || logText.toLowerCase().includes("mismatch") || logText.toLowerCase().includes("disqualified")) status = "Flagged";
        if (logText.toLowerCase().includes("failed") || logText.toLowerCase().includes("timeout") || logText.toLowerCase().includes("rejected")) status = "Failed";
        if (logText.toLowerCase().includes("review") || logText.toLowerCase().includes("escalat") || logText.toLowerCase().includes("pending")) status = "Review";

        let role = "SYSTEM";
        if (logText.toLowerCase().includes("officer") || logText.toLowerCase().includes("approved") || logText.toLowerCase().includes("marked")) role = "OFFICER";
        else if (logText.toLowerCase().includes("ai") || logText.toLowerCase().includes("ocr") || logText.toLowerCase().includes("scoring") || logText.toLowerCase().includes("parsed")) role = "AI_ENGINE";
        else if (logText.toLowerCase().includes("admin") || logText.toLowerCase().includes("rule")) role = "ADMIN";
        else if (logText.toLowerCase().includes("bidder") || logText.toLowerCase().includes("upload")) role = "BIDDER";

        const cleanAction = logText.includes(":") ? logText.split(":")[0].replace(/\[.*?\]\s*/, "") : logText.replace(/\[.*?\]\s*/, "");

        return {
          id: `AUD-2026-${String(90420 + Number(b.id) * 5 + idx).padStart(5, "0")}`,
          timestamp: b.date || "30 Aug 2026, 14:45:00 IST",
          date: "2026-08-30",
          user: role === "OFFICER" ? "Procurement Officer Rajesh Kumar" : role === "AI_ENGINE" ? "AI Verification Engine" : role === "ADMIN" ? "Admin SuperUser" : b.bidderName,
          userId: role === "OFFICER" ? "OFF-8821" : role === "AI_ENGINE" ? "AI-SYS-01" : role === "ADMIN" ? "ADM-0001" : `BID-${b.id}`,
          role: role,
          action: cleanAction.length > 40 ? cleanAction.substring(0, 40) + "..." : cleanAction,
          actionType: logText.includes("approved") ? "Procurement Officer approved bid" : logText.includes("score") ? "Compliance score generated" : "Document verified",
          bidder: b.bidderName,
          tender: b.tenderId,
          status: status,
          details: logText,
          previousValue: `STATUS: UNDER_REVIEW | SCORE: ${b.score}%`,
          newValue: `STATUS: ${(b.status || "UNDER_REVIEW").toUpperCase()} | SCORE: ${b.score}%`,
          source: "GeM Audit Workflow Dispatcher",
          evidence: b.anomalies && b.anomalies.length > 0 ? b.anomalies.join("; ") : "All statutory documents verified against official government registries.",
          ipDevice: "192.168.1.104 | Chrome 128.0 (Win 11) | New Delhi HQ"
        };
      })
    );

    // Merge dynamic active events with seed audit logs
    const logsList = [...dynamicBidLogs, ...initialAuditLogs];
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Filter States
    const [dateFilter, setDateFilter] = useState("All");
    const [userFilter, setUserFilter] = useState("All");
    const [actionTypeFilter, setActionTypeFilter] = useState("All");
    const [bidderFilter, setBidderFilter] = useState("All");
    const [tenderFilter, setTenderFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeKpi, setActiveKpi] = useState("ALL");

    // KPI Metrics
    const totalActivities = logsList.length;
    const aiEvents = logsList.filter(l => l.role === "AI_ENGINE" || l.action.toLowerCase().includes("ai") || l.action.toLowerCase().includes("document") || l.action.toLowerCase().includes("gst") || l.action.toLowerCase().includes("pan")).length;
    const adminActions = logsList.filter(l => l.role === "ADMIN" || l.role === "OFFICER" || l.action.toLowerCase().includes("rule") || l.action.toLowerCase().includes("approved") || l.action.toLowerCase().includes("created")).length;
    const manualReviews = logsList.filter(l => l.status === "Review" || l.action.toLowerCase().includes("manual review")).length;
    const failedActions = logsList.filter(l => l.status === "Failed" || l.status === "Flagged").length;

    // Filter Logic
    const filteredLogs = logsList.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        l.id.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.bidder.toLowerCase().includes(q) ||
        l.tender.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q);

      const matchesDate = dateFilter === "All" || (dateFilter === "Today" && l.date === "2026-08-30") || (dateFilter === "Yesterday" && l.date === "2026-08-29");
      const matchesUser = userFilter === "All" || l.user.toLowerCase().includes(userFilter.toLowerCase());
      const matchesAction = actionTypeFilter === "All" || l.actionType.toLowerCase() === actionTypeFilter.toLowerCase();
      const matchesBidder = bidderFilter === "All" || l.bidder.toLowerCase().includes(bidderFilter.toLowerCase());
      const matchesTender = tenderFilter === "All" || l.tender.toLowerCase().includes(tenderFilter.toLowerCase());
      const matchesStatus = statusFilter === "All" || l.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesKpi =
        activeKpi === "ALL" ||
        (activeKpi === "AI" && (l.role === "AI_ENGINE" || l.action.toLowerCase().includes("ai") || l.action.toLowerCase().includes("document") || l.action.toLowerCase().includes("gst") || l.action.toLowerCase().includes("pan"))) ||
        (activeKpi === "ADMIN" && (l.role === "ADMIN" || l.role === "OFFICER" || l.action.toLowerCase().includes("rule") || l.action.toLowerCase().includes("approved") || l.action.toLowerCase().includes("created"))) ||
        (activeKpi === "REVIEW" && (l.status === "Review" || l.action.toLowerCase().includes("manual review"))) ||
        (activeKpi === "FAILED" && (l.status === "Failed" || l.status === "Flagged"));

      return matchesSearch && matchesDate && matchesUser && matchesAction && matchesBidder && matchesTender && matchesStatus && matchesKpi;
    });

    const resetFilters = () => {
      setDateFilter("All");
      setUserFilter("All");
      setActionTypeFilter("All");
      setBidderFilter("All");
      setTenderFilter("All");
      setStatusFilter("All");
      setSearchQuery("");
      setActiveKpi("ALL");
    };

    // Export Handlers
    const handleExportCSV = () => {
      const headers = ["Event ID", "Timestamp", "User", "Role", "Action", "Bidder", "Tender", "Status", "Details", "Previous Value", "New Value", "Source", "Evidence", "IP/Device"];
      const rows = filteredLogs.map((l) => [
        l.id,
        `"${l.timestamp}"`,
        `"${l.user}"`,
        l.role,
        `"${l.action}"`,
        `"${l.bidder}"`,
        `"${l.tender}"`,
        l.status,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.previousValue.replace(/"/g, '""')}"`,
        `"${l.newValue.replace(/"/g, '""')}"`,
        `"${l.source}"`,
        `"${l.evidence.replace(/"/g, '""')}"`,
        `"${l.ipDevice}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `BidVerify_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleDownloadReport = () => {
      alert(`Generating Official Audit Trail Executive Compliance Report...\n\nTotal Records Exported: ${filteredLogs.length}\nFormat: PDF Audit Ledger`);
    };

    // UI Helpers
    const getActionIcon = (act) => {
      const a = act.toLowerCase();
      if (a.includes("uploaded")) return <CloudUpload size={15} style={{ color: "#2563eb" }} />;
      if (a.includes("document verified")) return <ShieldCheck size={15} style={{ color: "#16a34a" }} />;
      if (a.includes("gst")) return <CheckCircle2 size={15} style={{ color: "#0284c7" }} />;
      if (a.includes("pan")) return <FileCheck2 size={15} style={{ color: "#0284c7" }} />;
      if (a.includes("risk")) return <AlertTriangle size={15} style={{ color: "#ea580c" }} />;
      if (a.includes("score")) return <Sparkles size={15} style={{ color: "#9333ea" }} />;
      if (a.includes("rule")) return <Sliders size={15} style={{ color: "#d97706" }} />;
      if (a.includes("manual review")) return <Clock size={15} style={{ color: "#2563eb" }} />;
      if (a.includes("approved")) return <Award size={15} style={{ color: "#16a34a" }} />;
      if (a.includes("account created")) return <UserPlus size={15} style={{ color: "#2563eb" }} />;
      return <Info size={15} style={{ color: "#64748b" }} />;
    };

    const getStatusBadgeStyle = (st) => {
      switch (st) {
        case "Success":
          return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", icon: "✓" };
        case "Failed":
          return { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5", icon: "✕" };
        case "Flagged":
          return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", icon: "⚠" };
        case "Review":
          return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "🔍" };
        default:
          return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", icon: "●" };
      }
    };

    const getRoleBadgeStyle = (r) => {
      switch (r) {
        case "ADMIN":
          return { bg: "#faf5ff", color: "#9333ea", border: "#e9d5ff" };
        case "OFFICER":
          return { bg: "#f0f9ff", color: "#0284c7", border: "#bae6fd" };
        case "AI_ENGINE":
          return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
        case "BIDDER":
          return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
        default:
          return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "4px" }}>

        {/* MAIN HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              AUDIT TRAIL
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
              Track every verification, administrative action and compliance decision.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "9px 16px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#1e293b",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease"
              }}
            >
              <Download size={15} style={{ color: "#2563eb" }} /> Export Audit Log
            </button>

            <button
              onClick={handleDownloadReport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#2563eb",
                border: "none",
                borderRadius: "8px",
                padding: "9px 18px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                transition: "all 0.2s ease"
              }}
            >
              <FileText size={15} /> Download Report
            </button>
          </div>
        </div>

        {/* TOP STATISTICS (5 KPI CARDS ROW) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px" }}>

          {/* Card 1: Total Activities */}
          <div
            onClick={() => setActiveKpi("ALL")}
            style={{
              background: activeKpi === "ALL" ? "#f8fafc" : "#ffffff",
              border: activeKpi === "ALL" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeKpi === "ALL" ? "#2563eb" : "#64748b", textTransform: "uppercase" }}>TOTAL ACTIVITIES</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#0f172a", margin: "4px 0 2px 0", lineHeight: 1 }}>{totalActivities}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>All recorded logs</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <ClipboardList size={18} />
            </div>
          </div>

          {/* Card 2: AI Verification Events */}
          <div
            onClick={() => setActiveKpi("AI")}
            style={{
              background: activeKpi === "AI" ? "#eff6ff" : "#ffffff",
              border: activeKpi === "AI" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeKpi === "AI" ? "#2563eb" : "#64748b", textTransform: "uppercase" }}>AI VERIFICATION EVENTS</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#2563eb", margin: "4px 0 2px 0", lineHeight: 1 }}>{aiEvents}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>OCR & API checks</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Sparkles size={18} />
            </div>
          </div>

          {/* Card 3: Admin Actions */}
          <div
            onClick={() => setActiveKpi("ADMIN")}
            style={{
              background: activeKpi === "ADMIN" ? "#faf5ff" : "#ffffff",
              border: activeKpi === "ADMIN" ? "2px solid #9333ea" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeKpi === "ADMIN" ? "#9333ea" : "#64748b", textTransform: "uppercase" }}>ADMIN ACTIONS</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#9333ea", margin: "4px 0 2px 0", lineHeight: 1 }}>{adminActions}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Rules & Approvals</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea" }}>
              <ShieldCheck size={18} />
            </div>
          </div>

          {/* Card 4: Manual Reviews */}
          <div
            onClick={() => setActiveKpi("REVIEW")}
            style={{
              background: activeKpi === "REVIEW" ? "#fff7ed" : "#ffffff",
              border: activeKpi === "REVIEW" ? "2px solid #ea580c" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeKpi === "REVIEW" ? "#ea580c" : "#64748b", textTransform: "uppercase" }}>MANUAL REVIEWS</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#ea580c", margin: "4px 0 2px 0", lineHeight: 1 }}>{manualReviews}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Officer Escalate</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <Clock3 size={18} />
            </div>
          </div>

          {/* Card 5: Failed Actions */}
          <div
            onClick={() => setActiveKpi("FAILED")}
            style={{
              background: activeKpi === "FAILED" ? "#fef2f2" : "#ffffff",
              border: activeKpi === "FAILED" ? "2px solid #dc2626" : "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "16px 18px",
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}
          >
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: activeKpi === "FAILED" ? "#dc2626" : "#64748b", textTransform: "uppercase" }}>FAILED ACTIONS</span>
              <h2 style={{ fontSize: "1.7rem", fontWeight: 900, color: "#dc2626", margin: "4px 0 2px 0", lineHeight: 1 }}>{failedActions}</h2>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Timeouts & Flags</span>
            </div>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
              <AlertTriangle size={18} />
            </div>
          </div>

        </div>

        {/* FILTERS TOOLBAR */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Top Search Line */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ position: "relative", flexGrow: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search audit trail by Event ID, User, Action, Bidder, Tender, or Details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", color: "#0f172a", outline: "none" }}
              />
            </div>
            <button
              onClick={resetFilters}
              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Reset Filters
            </button>
          </div>

          {/* Grid of 6 Dropdown Filters */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>

            {/* 1. Date */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Dates</option>
                <option value="Today">Today (30 Aug)</option>
                <option value="Yesterday">Yesterday (29 Aug)</option>
              </select>
            </div>

            {/* 2. User */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Users</option>
                <option value="AI Verification Engine">AI Verification Engine</option>
                <option value="Rajesh Kumar">Officer Rajesh Kumar</option>
                <option value="Admin SuperUser">Admin SuperUser</option>
                <option value="System Security Service">System Security Service</option>
                <option value="Supplier Account User">Supplier Account User</option>
              </select>
            </div>

            {/* 3. Action Type */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Action Type</label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Actions</option>
                <option value="Bid uploaded">Bid uploaded</option>
                <option value="Document verified">Document verified</option>
                <option value="GST checked">GST checked</option>
                <option value="PAN checked">PAN checked</option>
                <option value="AI risk calculated">AI risk calculated</option>
                <option value="Compliance score generated">Compliance score generated</option>
                <option value="Rule updated">Rule updated</option>
                <option value="Bid sent for manual review">Bid sent for manual review</option>
                <option value="Procurement Officer approved bid">Procurement Officer approved bid</option>
                <option value="User account created">User account created</option>
              </select>
            </div>

            {/* 4. Bidder */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Bidder</label>
              <select
                value={bidderFilter}
                onChange={(e) => setBidderFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Bidders</option>
                <option value="Acme Tech Solutions">Acme Tech Solutions</option>
                <option value="Global Traders">Global Traders Inc</option>
                <option value="Vanguard Systems">Vanguard Systems Ltd</option>
                <option value="ABC Engineering">ABC Engineering Pvt Ltd</option>
                <option value="XYZ Industries">XYZ Industries Pvt Ltd</option>
                <option value="TechVision Solutions">TechVision Solutions</option>
              </select>
            </div>

            {/* 5. Tender */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Tender</label>
              <select
                value={tenderFilter}
                onChange={(e) => setTenderFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Tenders</option>
                <option value="GEM-CPCL-2026-001">GEM-CPCL-2026-001</option>
                <option value="GEM-CPCL-2026-002">GEM-CPCL-2026-002</option>
                <option value="GEM-CPCL-2026-003">GEM-CPCL-2026-003</option>
                <option value="GEM-CPCL-001">GEM-CPCL-001</option>
              </select>
            </div>

            {/* 6. Status */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", color: "#0f172a", background: "#ffffff" }}
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Review">Review</option>
                <option value="Flagged">Flagged</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

          </div>

        </div>

        {/* DETAILED ACTIVITY TABLE */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", textAlign: "left" }}>
                  <th style={{ padding: "14px 16px" }}>Timestamp</th>
                  <th style={{ padding: "14px 16px" }}>User</th>
                  <th style={{ padding: "14px 16px" }}>Role</th>
                  <th style={{ padding: "14px 16px" }}>Action</th>
                  <th style={{ padding: "14px 16px" }}>Bidder / Tender</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const stStyle = getStatusBadgeStyle(log.status);
                  const rlStyle = getRoleBadgeStyle(log.role);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEvent(log)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      {/* Timestamp & ID */}
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ display: "block", color: "#0f172a", fontSize: "0.8rem" }}>{log.timestamp}</strong>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>{log.id}</span>
                      </td>

                      {/* User */}
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#0f172a", display: "block" }}>{log.user}</strong>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{log.userId}</span>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            background: rlStyle.bg,
                            color: rlStyle.color,
                            border: `1px solid ${rlStyle.border}`
                          }}
                        >
                          {log.role}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {getActionIcon(log.action)}
                          </div>
                          <strong style={{ color: "#0f172a", fontSize: "0.82rem" }}>{log.action}</strong>
                        </div>
                      </td>

                      {/* Bidder / Tender */}
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#334155", display: "block" }}>{log.bidder}</strong>
                        <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 700 }}>{log.tender}</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            background: stStyle.bg,
                            color: stStyle.color,
                            border: `1px solid ${stStyle.border}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <span>{stStyle.icon}</span> {log.status}
                        </span>
                      </td>

                      {/* Details */}
                      <td style={{ padding: "14px 16px", color: "#475569", fontSize: "0.78rem", maxWidth: "280px" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                      No audit logs found matching active filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div style={{ padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#64748b" }}>
            <span>Showing <strong>{filteredLogs.length}</strong> of <strong>{logsList.length}</strong> audit records</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>🔒 Cryptographic Audit Hashing Active (SHA-256 Ledger)</span>
          </div>
        </div>

        {/* DETAILED AUDIT EVENT SIDE DRAWER / MODAL */}
        {selectedEvent && (
          <div className="drawer-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="audit-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>

              {/* Header */}
              <div className="drawer-header" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "20px 24px" }}>
                <div className="drawer-title">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, background: "#0284c7", color: "#ffffff", padding: "2px 8px", borderRadius: "10px" }}>
                      EVENT AUDIT RECORD
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#cbd5e1", fontFamily: "monospace" }}>{selectedEvent.id}</span>
                  </div>
                  <h2 style={{ fontSize: "1.25rem", margin: "6px 0 2px 0", color: "#ffffff" }}>{selectedEvent.action}</h2>
                  <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>Timestamp: {selectedEvent.timestamp}</span>
                </div>
                <button className="close-btn" style={{ color: "#ffffff" }} onClick={() => setSelectedEvent(null)}>✕</button>
              </div>

              {/* Drawer Content Body */}
              <div className="drawer-content" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Status & Role Summary Pill Bar */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>EVENT STATUS</span>
                    <strong style={{ fontSize: "0.9rem", color: selectedEvent.status === "Success" ? "#16a34a" : selectedEvent.status === "Failed" ? "#dc2626" : "#ea580c" }}>
                      ● {selectedEvent.status.toUpperCase()}
                    </strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, display: "block" }}>PERFORMED BY</span>
                    <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{selectedEvent.user} ({selectedEvent.role})</strong>
                  </div>
                </div>

                {/* Detailed Audit Event Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Event ID & Timestamp</span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                      {selectedEvent.id} — {selectedEvent.timestamp}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>User / Actor</span>
                      <strong style={{ fontSize: "0.82rem", color: "#0f172a", display: "block", marginTop: "2px" }}>{selectedEvent.user}</strong>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>ID: {selectedEvent.userId}</span>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>System / AI Source</span>
                      <strong style={{ fontSize: "0.82rem", color: "#2563eb", display: "block", marginTop: "2px" }}>{selectedEvent.source}</strong>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Related Bidder</span>
                      <strong style={{ fontSize: "0.82rem", color: "#0f172a", display: "block", marginTop: "2px" }}>{selectedEvent.bidder}</strong>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Related Tender</span>
                      <strong style={{ fontSize: "0.82rem", color: "#0284c7", display: "block", marginTop: "2px" }}>{selectedEvent.tender}</strong>
                    </div>
                  </div>

                  {/* State Delta: Previous Value vs New Value */}
                  <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: "8px", padding: "12px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 800, textTransform: "uppercase" }}>State Delta / Historical Comparison</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", fontSize: "0.78rem" }}>
                      <div>
                        <span style={{ color: "#78350f", fontWeight: 700 }}>Previous Value: </span>
                        <code style={{ background: "#ffffff", padding: "2px 6px", borderRadius: "4px", border: "1px solid #fde68a", color: "#92400e" }}>{selectedEvent.previousValue}</code>
                      </div>
                      <div>
                        <span style={{ color: "#15803d", fontWeight: 700 }}>New Value: </span>
                        <code style={{ background: "#ffffff", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bbf7d0", color: "#166534" }}>{selectedEvent.newValue}</code>
                      </div>
                    </div>
                  </div>

                  {/* Verification Evidence */}
                  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "12px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#0369a1", fontWeight: 800, textTransform: "uppercase" }}>Verification Evidence & Proof</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#0c4a6e", lineHeight: 1.4 }}>
                      {selectedEvent.evidence}
                    </p>
                  </div>

                  {/* IP / Device Information */}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase" }}>IP & Device Telemetry</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "#334155", fontFamily: "monospace" }}>
                      {selectedEvent.ipDevice}
                    </p>
                  </div>

                </div>

              </div>

              <div className="drawer-actions" style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "9px 22px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Close Inspection
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  };

  // Fully Functional Multi-Step Create Tender View
  const CreateTenderView = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiExtracted, setAiExtracted] = useState(false);
    const [saveToast, setSaveToast] = useState("");
    const [customDocName, setCustomDocName] = useState("");

    // Form State
    const [formData, setFormData] = useState({
      tenderId: "GEM-CPCL-2026-004",
      title: "Supply of Industrial Pumps & High-Pressure Valves",
      organization: "Chennai Petroleum Corporation Limited",
      department: "Procurement & Refineries Division",
      category: "Industrial Equipment & Heavy Machinery",
      estimatedValue: "₹50,00,000",
      submissionDeadline: "2026-09-30",
      description: "Procurement of heavy-duty centrifugal industrial pumps, control valves, and statutory pressure safety assemblies.",
      contactEmail: "procurement@cpcl.gov.in",

      // Step 2: Requirements
      minTurnover: "50",
      minExperienceYears: "3",
      minLocalContent: "50",
      oemAuthorizationRequired: true,
      gstinMandatory: true,
      panMandatory: true,
      startupExemption: true,
      msmeExemption: true,

      // Step 3: Required Documents
      documents: {
        gstCertificate: true,
        panCard: true,
        itrReturns: true,
        oemAuthorization: true,
        msmeUdyam: false,
        landBorderDeclaration: true,
        emdReceipt: true
      },
      customDocs: ["ISO 9001:2015 Quality Management Certificate"]
    });

    const handleInputChange = (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDocToggle = (docKey) => {
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: !prev.documents[docKey]
        }
      }));
    };

    const handleAddCustomDoc = () => {
      if (!customDocName.trim()) return;
      setFormData((prev) => ({
        ...prev,
        customDocs: [...prev.customDocs, customDocName.trim()]
      }));
      setCustomDocName("");
    };

    const handleRemoveCustomDoc = (idx) => {
      setFormData((prev) => ({
        ...prev,
        customDocs: prev.customDocs.filter((_, i) => i !== idx)
      }));
    };

    const handleExtractAI = () => {
      setAiAnalyzing(true);
      setTimeout(() => {
        setAiAnalyzing(false);
        setAiExtracted(true);
        setFormData((prev) => ({
          ...prev,
          minTurnover: "75",
          minExperienceYears: "4",
          minLocalContent: "60",
          oemAuthorizationRequired: true,
          description: "AI Extracted: High-pressure centrifugal pumps (API 610 compliant) for CPCL refinery unit 4. Requires mandatory OEM warranty certificate and 4-year experience."
        }));
        showToast("✨ AI Requirement Assistant successfully extracted 14 compliance parameters & rules!");
      }, 900);
    };

    const showToast = (msg) => {
      setSaveToast(msg);
      setTimeout(() => setSaveToast(""), 4000);
    };

    const handleSaveDraft = () => {
      showToast("💾 Tender DraftSaved Successfully! ID: " + formData.tenderId);
    };

    const handlePublishTender = () => {
      const newTenderObj = {
        id: formData.tenderId || `CPCL/2026/0${tendersList.length + 1}`,
        title: formData.title || "New Procurement Tender",
        category: formData.category || "Equipment",
        department: formData.department || "Projects",
        publishedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        closingDate: formData.submissionDeadline || "30 Sep 2026",
        daysLeft: "30 days left",
        bidders: 0,
        pending: 0,
        status: "Active"
      };

      setPendingTenderAction({
        type: "CREATE",
        payload: {
          newTenderObj,
          onSuccess: () => {
            setCurrentStep(5);
            showToast("🚀 Tender Successfully Published to GeM Procurement Network!");
          }
        },
        actionTitle: "Authorize Tender Publication",
        description: `Publishing new tender '${newTenderObj.id}' (${newTenderObj.title}). Authorization password required.`
      });
    };



    const handleNext = () => {
      if (currentStep === 1 && !formData.title.trim()) {
        alert("Please enter a Tender Title before proceeding.");
        return;
      }
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      }
    };

    const handleBack = () => {
      if (currentStep > 1) {
        setCurrentStep((prev) => prev - 1);
      }
    };

    return (
      <div className="create-tender-content" style={{ position: "relative" }}>
        {/* Floating Toast Notification */}
        {saveToast && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              zIndex: 99999,
              background: "#0f172a",
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              borderLeft: "4px solid #10b981",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <CheckCircle2 size={18} style={{ color: "#10b981" }} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="welcome-banner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>Create New Tender</h1>
              <p className="subtitle">Define tender specifications, statutory requirements, and compliance evaluation criteria.</p>
            </div>
            {currentStep < 5 && (
              <span style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", padding: "6px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700 }}>
                Step {currentStep} of 4: {currentStep === 1 ? "Basic Details" : currentStep === 2 ? "Requirements" : currentStep === 3 ? "Documents" : "Review & Publish"}
              </span>
            )}
          </div>
        </div>

        {/* Multi-step progress indicator bar */}
        <div className="tender-steps-indicator" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", padding: "16px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div
            className={`step ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}
            onClick={() => currentStep < 5 && setCurrentStep(1)}
            style={{ cursor: currentStep < 5 ? "pointer" : "default", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: currentStep >= 1 ? "#2563eb" : "#94a3b8" }}
          >
            <span className="step-num" style={{ background: currentStep >= 1 ? "#2563eb" : "#f1f5f9", color: currentStep >= 1 ? "#ffffff" : "#64748b" }}>
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span>Basic Details</span>
          </div>

          <div className="step-line" style={{ flexGrow: 1, height: "2px", background: currentStep > 1 ? "#2563eb" : "#e2e8f0", margin: "0 12px" }}></div>

          <div
            className={`step ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}
            onClick={() => currentStep < 5 && setCurrentStep(2)}
            style={{ cursor: currentStep < 5 ? "pointer" : "default", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: currentStep >= 2 ? "#2563eb" : "#94a3b8" }}
          >
            <span className="step-num" style={{ background: currentStep >= 2 ? "#2563eb" : "#f1f5f9", color: currentStep >= 2 ? "#ffffff" : "#64748b" }}>
              {currentStep > 2 ? "✓" : "2"}
            </span>
            <span>Requirements</span>
          </div>

          <div className="step-line" style={{ flexGrow: 1, height: "2px", background: currentStep > 2 ? "#2563eb" : "#e2e8f0", margin: "0 12px" }}></div>

          <div
            className={`step ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}
            onClick={() => currentStep < 5 && setCurrentStep(3)}
            style={{ cursor: currentStep < 5 ? "pointer" : "default", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: currentStep >= 3 ? "#2563eb" : "#94a3b8" }}
          >
            <span className="step-num" style={{ background: currentStep >= 3 ? "#2563eb" : "#f1f5f9", color: currentStep >= 3 ? "#ffffff" : "#64748b" }}>
              {currentStep > 3 ? "✓" : "3"}
            </span>
            <span>Documents</span>
          </div>

          <div className="step-line" style={{ flexGrow: 1, height: "2px", background: currentStep > 3 ? "#2563eb" : "#e2e8f0", margin: "0 12px" }}></div>

          <div
            className={`step ${currentStep === 4 ? "active" : currentStep > 4 ? "completed" : ""}`}
            onClick={() => currentStep < 5 && setCurrentStep(4)}
            style={{ cursor: currentStep < 5 ? "pointer" : "default", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: currentStep >= 4 ? "#2563eb" : "#94a3b8" }}
          >
            <span className="step-num" style={{ background: currentStep >= 4 ? "#2563eb" : "#f1f5f9", color: currentStep >= 4 ? "#ffffff" : "#64748b" }}>
              {currentStep === 5 ? "✓" : "4"}
            </span>
            <span>Review</span>
          </div>

          <div className="step-line" style={{ flexGrow: 1, height: "2px", background: currentStep === 5 ? "#10b981" : "#e2e8f0", margin: "0 12px" }}></div>

          <div
            className={`step ${currentStep === 5 ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: currentStep === 5 ? "#10b981" : "#94a3b8" }}
          >
            <span className="step-num" style={{ background: currentStep === 5 ? "#10b981" : "#f1f5f9", color: currentStep === 5 ? "#ffffff" : "#64748b" }}>
              5
            </span>
            <span>Publish</span>
          </div>
        </div>

        {/* STEP 1: BASIC DETAILS & AI ASSISTANT */}
        {currentStep === 1 && (
          <div className="dashboard-main-split">
            {/* Left Column - Form */}
            <div className="split-left-col">
              <div className="section-panel" style={{ padding: "30px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Basic Tender Information</h2>
                  {aiExtracted && (
                    <span style={{ fontSize: "0.72rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "12px", fontWeight: 700 }}>
                      ✨ AI Extracted Metadata
                    </span>
                  )}
                </div>

                <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Tender ID</label>
                    <input type="text" value={formData.tenderId} disabled className="disabled-input" />
                  </div>

                  <div className="form-group">
                    <label>Tender Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      placeholder="e.g. Industrial Equipment"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Tender Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter official tender title"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Organization Name</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange("organization", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Procurement Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Estimated Value (INR)</label>
                    <input
                      type="text"
                      value={formData.estimatedValue}
                      onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Submission Deadline</label>
                    <input
                      type="text"
                      value={formData.submissionDeadline}
                      onChange={(e) => handleInputChange("submissionDeadline", e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Detailed Scope of Work & Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a", backgroundColor: "#ffffff", fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - AI Requirement Extraction */}
            <div className="split-right-col">
              <div className="ai-assistant-card" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)", borderRadius: "16px", padding: "24px", color: "#ffffff" }}>
                <div className="ai-card-header">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                    AI Requirement Assistant <Sparkles size={18} style={{ color: "#fbbf24" }} />
                  </h3>
                </div>

                <p className="ai-message" style={{ margin: "10px 0 16px 0", fontSize: "0.85rem", color: "#c7d2fe", lineHeight: 1.4 }}>
                  "Upload a tender specification PDF or RFP document. AI will parse technical clauses, statutory compliance mandates, and turnover thresholds automatically."
                </p>

                {/* Dropzone */}
                <div
                  className="tender-dropzone"
                  onClick={handleExtractAI}
                  style={{ border: "2px dashed rgba(255, 255, 255, 0.25)", borderRadius: "12px", padding: "24px 16px", background: "rgba(255, 255, 255, 0.05)", textAlign: "center", cursor: "pointer" }}
                >
                  <CloudUpload size={32} style={{ color: "#818cf8", marginBottom: "8px" }} />
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, display: "block" }}>Drop Tender RFP Document (.PDF)</span>
                  <small style={{ color: "#94a3b8", display: "block", marginTop: "4px" }}>Click to auto-parse requirements</small>
                </div>

                <button
                  type="button"
                  disabled={aiAnalyzing}
                  onClick={handleExtractAI}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    background: "#ffffff",
                    color: "#4f46e5",
                    border: "none",
                    borderRadius: "8px",
                    padding: "11px",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  <Sparkles size={16} className={aiAnalyzing ? "animate-spin" : ""} />
                  {aiAnalyzing ? "Extracting Requirements..." : "Extract Requirements with AI"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REQUIREMENTS & ELIGIBILITY */}
        {currentStep === 2 && (
          <div className="dashboard-main-split">
            <div className="split-left-col">
              <div className="section-panel" style={{ padding: "30px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                  Eligibility & Statutory Compliance Rules
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "20px" }}>
                  Set minimum qualification criteria for bidders on turnover, technical experience, and statutory registrations.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label>Minimum Annual Turnover (₹ Lakhs)</label>
                    <input
                      type="number"
                      value={formData.minTurnover}
                      onChange={(e) => handleInputChange("minTurnover", e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Technical Experience (Years)</label>
                    <input
                      type="number"
                      value={formData.minExperienceYears}
                      onChange={(e) => handleInputChange("minExperienceYears", e.target.value)}
                      placeholder="e.g. 3"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Minimum Local Content % (Make in India GFR 144)</label>
                    <input
                      type="number"
                      value={formData.minLocalContent}
                      onChange={(e) => handleInputChange("minLocalContent", e.target.value)}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", margin: "10px 0 4px 0" }}>
                    Statutory Clearances & Exemptions
                  </h3>

                  {/* Toggle Option 1: OEM Auth */}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>OEM Authorization Required</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Bidders must submit direct Manufacturer Authorization Certificate.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.oemAuthorizationRequired}
                      onChange={(e) => handleInputChange("oemAuthorizationRequired", e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                    />
                  </label>

                  {/* Toggle Option 2: Active GSTIN */}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>Mandatory Active GSTIN & Tax Filing Clearances</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Automated API cross-verification against GSTN registry.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.gstinMandatory}
                      onChange={(e) => handleInputChange("gstinMandatory", e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                    />
                  </label>

                  {/* Toggle Option 3: Startup Exemption */}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>DPIIT Registered Startup Relaxation</strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Relax turnover & prior experience norms for DPIIT recognized startups.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.startupExemption}
                      onChange={(e) => handleInputChange("startupExemption", e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Rule Matrix Score Allocation */}
            <div className="split-right-col">
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0" }}>
                  Rule Evaluation Matrix (100 Points)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Document Completeness</span>
                    <strong>25 Pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Statutory API Verification</span>
                    <strong>35 Pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Integrity & Forensic Checks</span>
                    <strong>20 Pts</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Custom Rules Alignment</span>
                    <strong>20 Pts</strong>
                  </div>
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#16a34a" }}>
                    <span>Total Evaluation Score</span>
                    <span>100 Pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MANDATORY DOCUMENTS */}
        {currentStep === 3 && (
          <div className="dashboard-main-split">
            <div className="split-left-col">
              <div className="section-panel" style={{ padding: "30px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                  Required Statutory Documents Checklist
                </h2>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "20px" }}>
                  Select mandatory documents bidders must upload during bid submission.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { key: "gstCertificate", label: "GSTIN Registration Certificate", desc: "Mandatory for tax verification" },
                    { key: "panCard", label: "Standalone PAN Card Document", desc: "CBDT cross-matching" },
                    { key: "itrReturns", label: "Income Tax Returns (Last 3 Financial Yrs)", desc: "Financial solvency verification" },
                    { key: "oemAuthorization", label: "OEM Authorization & Warranty Certificate", desc: "Technical authenticity" },
                    { key: "msmeUdyam", label: "MSME Udyam Registration Certificate", desc: "EMD waiver verification" },
                    { key: "landBorderDeclaration", label: "Land Border Compliance Declaration (GFR Rule 144)", desc: "Sovereign security clause" },
                    { key: "emdReceipt", label: "EMD Deposit / Exemption Proof", desc: "Financial commitment" }
                  ].map((docItem) => (
                    <label
                      key={docItem.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between",
                        padding: "12px 16px",
                        background: formData.documents[docItem.key] ? "#eff6ff" : "#f8fafc",
                        border: formData.documents[docItem.key] ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{docItem.label}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{docItem.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.documents[docItem.key]}
                        onChange={() => handleDocToggle(docItem.key)}
                        style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                      />
                    </label>
                  ))}
                </div>

                {/* Add Custom Document */}
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1" }}>
                  <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e293b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    + Add Custom Document Requirement
                  </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="e.g. ISO 9001:2015 Certificate, Past Performance Certificates"
                      value={customDocName}
                      onChange={(e) => setCustomDocName(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.85rem", color: "#0f172a", backgroundColor: "#ffffff" }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDoc}
                      style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.2)" }}
                    >
                      Add Document
                    </button>
                  </div>

                  {formData.customDocs.length > 0 && (
                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {formData.customDocs.map((doc, idx) => (
                        <span key={idx} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "16px", padding: "4px 12px", fontSize: "0.78rem", color: "#334155", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          📄 {doc}
                          <button type="button" onClick={() => handleRemoveCustomDoc(idx)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 800 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & PUBLISH PREVIEW */}
        {currentStep === 4 && (
          <div className="dashboard-main-split">
            <div className="split-left-col" style={{ gridColumn: "span 2" }}>
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "10px" }}>
                      TENDER PREVIEW & COMPILATION
                    </span>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0f172a", margin: "6px 0 2px 0" }}>{formData.title}</h2>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Tender ID: <strong>{formData.tenderId}</strong> — {formData.organization} ({formData.department})</span>
                  </div>

                  <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", padding: "4px 12px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 800 }}>
                    STATUS: DRAFT
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "0.85rem" }}>
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ display: "block", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase" }}>Estimated Budget</strong>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{formData.estimatedValue}</span>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ display: "block", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase" }}>Submission Deadline</strong>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>{formData.submissionDeadline}</span>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ display: "block", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase" }}>Minimum Turnover & Experience</strong>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>₹{formData.minTurnover} Lakhs Turnover | {formData.minExperienceYears} Yrs Experience</span>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ display: "block", color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase" }}>Local Content % Requirement</strong>
                    <span style={{ fontWeight: 700, color: "#16a34a" }}>Minimum {formData.minLocalContent}% (Make in India Compliant)</span>
                  </div>
                </div>

                {/* Cryptographic Ledger Preview (Hidden as per user requirement)
                <div style={{ marginTop: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "10px" }}>
                  <strong style={{ fontSize: "0.78rem", color: "#15803d", textTransform: "uppercase", display: "block" }}>
                    🔒 Sovereign Cryptographic Hash Ledger Preview
                  </strong>
                  <code style={{ fontSize: "0.75rem", color: "#166534", fontFamily: "monospace", display: "block", marginTop: "4px" }}>
                    SHA256: 8f4a9b21c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f6
                  </code>
                </div>
                */}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PUBLISH SUCCESS CONFIRMATION */}
        {currentStep === 5 && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "40px", textAlign: "center", maxWidth: "680px", margin: "20px auto" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", boxShadow: "0 10px 20px rgba(22,163,74,0.2)" }}>
              <CheckCircle2 size={42} />
            </div>

            <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "#16a34a", color: "#ffffff", padding: "4px 12px", borderRadius: "12px", letterSpacing: "0.5px" }}>
              TENDER LIVE & PUBLISHED
            </span>

            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: "14px 0 8px 0" }}>
              Tender {formData.tenderId} Published Successfully!
            </h2>

            <p style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5, marginBottom: "24px" }}>
              "{formData.title}" is now active on the Government e-Procurement Portal. Bidders can view criteria, upload documents, and submit bids.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "28px", textAlign: "left", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Tender ID:</span>
                <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{formData.tenderId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Published Timestamp:</span>
                <strong style={{ color: "#0f172a" }}>31 August 2026, 19:18 IST</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Ledger Integrity Status:</span>
                <strong style={{ color: "#16a34a" }}>✓ SHA-256 Ledger Verified</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={() => { setCurrentStep(1); setFormData((prev) => ({ ...prev, tenderId: "GEM-CPCL-2026-005", title: "" })); }}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#334155", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
              >
                + Create Another Tender
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("tenders")}
                style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}
              >
                View Live Tenders Listing →
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION NAVIGATION BAR (STEPS 1 - 4) */}
        {currentStep < 5 && (
          <div className="bottom-actions-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}
                >
                  ← Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSection("tenders")}
                  style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="button"
                className="secondary-action-btn"
                onClick={handleSaveDraft}
                style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 20px", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", cursor: "pointer" }}
              >
                💾 Save Draft
              </button>

              {currentStep === 4 ? (
                <button
                  type="button"
                  onClick={handlePublishTender}
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "0.88rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)" }}
                >
                  🚀 Publish Tender to GeM →
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={handleNext}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "0.88rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }}
                >
                  Next: {currentStep === 1 ? "Requirements" : currentStep === 2 ? "Documents" : "Review"} →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Reports & Analysis View for Procurement Admin
  const ReportsView = () => {
    const [selectedDateRange, setSelectedDateRange] = useState("01 May 2026 – 31 May 2026");
    const [isGenerating, setIsGenerating] = useState(false);

    // Dynamic metrics calculated strictly from active bids state
    const totalBidsCount = bids.length;
    const avgScoreVal = totalBidsCount > 0 ? Math.round(bids.reduce((acc, b) => acc + (b.score || 0), 0) / totalBidsCount) : 0;
    const totalIssuesCount = bids.reduce((acc, b) => acc + (b.anomalies ? b.anomalies.length : 0), 0);
    const approvedBidsCount = bids.filter(b => b.status === "Qualified" || b.status === "Passed" || b.status === "Approved").length;
    const compliantPct = totalBidsCount > 0 ? Math.round((approvedBidsCount / totalBidsCount) * 100) : 0;
    const nonCompliantCount = totalBidsCount - approvedBidsCount;
    const nonCompliantPct = 100 - compliantPct;

    const lowRiskCount = bids.filter(b => (b.score || 0) >= 80).length;
    const mediumRiskCount = bids.filter(b => (b.score || 0) >= 60 && (b.score || 0) < 80).length;
    const highRiskCount = bids.filter(b => (b.score || 0) >= 40 && (b.score || 0) < 60).length;
    const criticalRiskCount = bids.filter(b => (b.score || 0) < 40).length;

    const statutoryIssues = bids.reduce((acc, b) => acc + ((b.anomalies || []).filter(a => a.toLowerCase().includes("gst") || a.toLowerCase().includes("pan") || a.toLowerCase().includes("epfo")).length), 0);
    const financialIssues = bids.reduce((acc, b) => acc + ((b.anomalies || []).filter(a => a.toLowerCase().includes("solvency") || a.toLowerCase().includes("turnover") || a.toLowerCase().includes("financial")).length), 0);
    const technicalIssues = bids.reduce((acc, b) => acc + ((b.anomalies || []).filter(a => a.toLowerCase().includes("oem") || a.toLowerCase().includes("spec") || a.toLowerCase().includes("iso")).length), 0);
    const documentIssues = bids.reduce((acc, b) => acc + ((b.anomalies || []).filter(a => a.toLowerCase().includes("expiry") || a.toLowerCase().includes("format") || a.toLowerCase().includes("date")).length), 0);

    const handleExportPDF = () => {
      alert(`Generating Official GeM Governance PDF Report for period: ${selectedDateRange}\n\nDownloading 'GeM_Bid_Compliance_Report.pdf' (${totalBidsCount} Records)...`);
    };

    const handleExportExcel = () => {
      alert(`Exporting Data Matrix to Excel (.xlsx)...\n\nDownloading 'GeM_Compliance_Data.xlsx' (${totalBidsCount} Records).`);
    };

    const handleGenerateReport = () => {
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        alert(`Report refreshed successfully! ${totalBidsCount} bids synchronized with live database records.`);
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
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{totalBidsCount}</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
              <TrendingUp size={12} /> Dynamic Active State Sync
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
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#15803d", lineHeight: 1.1 }}>{avgScoreVal}%</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
              <TrendingUp size={12} /> Calculated across active bids
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
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#c2410c", lineHeight: 1.1 }}>{totalIssuesCount}</div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
              Flagged anomalies across bids
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
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#7e22ce", lineHeight: 1.1 }}>{(totalBidsCount * 0.4).toFixed(1)} hrs</div>
            <span style={{ fontSize: "0.72rem", color: "#7e22ce", fontWeight: 700 }}>
              ⚡ Real-time AI processing speed
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
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{approvedBidsCount}</div>
            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700 }}>
              {compliantPct}% approval rating
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
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Weekly progression for active bids</span>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px" }}>
                Current: {avgScoreVal}%
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
              <span>Batch #1</span>
              <span>Batch #2</span>
              <span>Batch #3</span>
              <span>Batch #4</span>
              <strong style={{ color: "#16a34a" }}>Latest Avg ({avgScoreVal}%)</strong>
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
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray={`${compliantPct}, 100`} />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", display: "block", lineHeight: 1 }}>{compliantPct}%</span>
                  <span style={{ fontSize: "0.65rem", color: "#16a34a", fontWeight: 700 }}>Compliant</span>
                </div>
              </div>

              {/* LEGEND BADGES */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", padding: "8px 12px", borderRadius: "8px", border: "1px solid #dcfce7" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }}></div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>{approvedBidsCount} Compliant Bids</strong>
                    <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>{compliantPct}% Total Rate</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fef2f2", padding: "8px 12px", borderRadius: "8px", border: "1px solid #fee2e2" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626" }}></div>
                  <div>
                    <strong style={{ color: "#0f172a", display: "block" }}>{nonCompliantCount} Non-Compliant Bids</strong>
                    <span style={{ fontSize: "0.7rem", color: "#dc2626" }}>{nonCompliantPct}% Flagged Rate</span>
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
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Distribution across {totalIssuesCount} total flagged issues</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.78rem" }}>

              {/* Category 1: Statutory */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Statutory & Tax Verification (GSTN, PAN, EPFO)</span>
                  <strong style={{ color: "#2563eb" }}>{statutoryIssues} Issues</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: `${totalIssuesCount > 0 ? (statutoryIssues / totalIssuesCount) * 100 : 0}%`, height: "100%", background: "#2563eb", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 2: Financial */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Financial Solvency & Turnover Certificates</span>
                  <strong style={{ color: "#ea580c" }}>{financialIssues} Issues</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: `${totalIssuesCount > 0 ? (financialIssues / totalIssuesCount) * 100 : 0}%`, height: "100%", background: "#ea580c", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 3: Technical */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Technical OEM Authorization & Specs</span>
                  <strong style={{ color: "#9333ea" }}>{technicalIssues} Issues</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: `${totalIssuesCount > 0 ? (technicalIssues / totalIssuesCount) * 100 : 0}%`, height: "100%", background: "#9333ea", borderRadius: "4px" }}></div>
                </div>
              </div>

              {/* Category 4: Document */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#334155" }}>Document Format & Expiry Date Mismatches</span>
                  <strong style={{ color: "#dc2626" }}>{documentIssues} Issues</strong>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px" }}>
                  <div style={{ width: `${totalIssuesCount > 0 ? (documentIssues / totalIssuesCount) * 100 : 0}%`, height: "100%", background: "#dc2626", borderRadius: "4px" }}></div>
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
                  <strong style={{ fontSize: "1.1rem", color: "#15803d" }}>{lowRiskCount}</strong>
                </div>
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "10px 6px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#ea580c", fontWeight: 700, display: "block" }}>MEDIUM</span>
                  <strong style={{ fontSize: "1.1rem", color: "#c2410c" }}>{mediumRiskCount}</strong>
                </div>
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 6px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700, display: "block" }}>HIGH RISK</span>
                  <strong style={{ fontSize: "1.1rem", color: "#b91c1c" }}>{highRiskCount}</strong>
                </div>
                <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", padding: "10px 6px", borderRadius: "8px", color: "#ffffff" }}>
                  <span style={{ fontSize: "0.68rem", color: "#fca5a5", fontWeight: 700, display: "block" }}>CRITICAL</span>
                  <strong style={{ fontSize: "1.1rem", color: "#ffffff" }}>{criticalRiskCount}</strong>
                </div>
              </div>
            </div>

            {/* Chart 5: Verification Status */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>5. Verification Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Approved & Qualified</span>
                  <strong style={{ color: "#16a34a" }}>{approvedBidsCount} ({compliantPct}%)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Pending Officer Review</span>
                  <strong style={{ color: "#2563eb" }}>{bids.filter(b => b.status === "Review Required" || b.status === "Under Review" || b.status === "Pending").length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 600 }}>● Disqualified / Flagged</span>
                  <strong style={{ color: "#dc2626" }}>{bids.filter(b => b.status === "Disqualified" || b.status === "Rejected" || b.status === "Flagged").length}</strong>
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
              <span style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>COMMON ANOMALIES</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • GSTIN Return Verification<br />
                • OEM Authorization Name Alignment<br />
                • Bank Solvency Validity
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>VERIFIED CLAUSES</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • GSTR-3B Filing Status<br />
                • EPFO Clearance<br />
                • Udyam MSME Exemption
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>PROCESSING SPEED</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • AI Processing Time: Under 3.5 minutes per bid<br />
                • Direct Government API Verification Active
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#c084fc", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>ACTIVE SUMMARY</span>
              <p style={{ fontSize: "0.8rem", color: "#e2e8f0", margin: "6px 0 0 0", lineHeight: 1.4 }}>
                • Total Active Bids: {totalBidsCount}<br />
                • Average Platform Compliance: {avgScoreVal}%
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
              The <strong>AI-Powered Integrated Bid Compliance Verification Platform</strong> evaluated <strong>{totalBidsCount} active procurement bids</strong> in real-time. Automated OCR parsing coupled with direct Government REST API integrations (CBDT, GSTN, MSME Udyam, EPFO) guarantees high data extraction fidelity.
            </p>
          </div>

          {/* SECTION 2: INSIGHTS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <Sparkles size={18} style={{ color: "#9333ea" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>INSIGHTS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Pattern recognition across <strong>{totalIssuesCount} flagged items</strong> revealed that non-compliance issues primarily stem from entity naming variations between GSTIN Registrant records and original OEM Authorization letters.
            </p>
          </div>

          {/* SECTION 3: CONCLUSIONS */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
              <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>CONCLUSIONS</h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: 0 }}>
              Overall bidder compliance on GeM procurement stands at <strong>{avgScoreVal}% average score</strong>. The introduction of immutable cryptographic audit hashing has eliminated post-decision tampering risks across all <strong>{approvedBidsCount} approved bids</strong>.
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

  // Admin "System Settings" View Component
  const SettingsView = () => {
    const [activeTab, setActiveTab] = useState("general");
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [saveToast, setSaveToast] = useState(false);

    const defaultSettings = {
      platformName: "AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
      organization: "Government e-Marketplace (GeM), Ministry of Commerce & Industry",
      department: "National Public Procurement & Compliance Auditing Bureau",
      timeZone: "(UTC+05:30) India Standard Time (IST)",
      dateFormat: "DD/MM/YYYY (e.g. 30/08/2026)",
      language: "English (India)",

      passwordPolicy: "STRICT",
      twoFactorAuth: true,
      sessionTimeout: "30",
      loginAttemptLimit: "5",
      ipRestrictions: "10.240.0.0/16, 14.143.0.0/19 (NIC Gov Grid Allowlist)",

      aiVerificationEnabled: true,
      documentAnalysis: true,
      mismatchDetection: true,
      riskScoring: true,
      aiRecommendation: true,
      confidenceThreshold: 85,

      emailNotifications: true,
      bidVerificationAlerts: true,
      highRiskAlerts: true,
      failedIntegrationAlerts: true,
      auditAlerts: true,

      defaultRiskThreshold: 65,
      complianceScoreThreshold: 75,
      mandatoryDocPolicy: "STRICT",
      autoReverification: true,
      tenderSpecificRules: true,

      docRetention: "7_YEARS",
      auditRetention: "INDEFINITE",
      backupFrequency: "HOURLY",
      dataExportFormat: "ALL",

      apiEndpoint: "https://gateway.gem.gov.in/api/v2.4/compliance",
      connectionTimeout: "5000",
      retryAttempts: "3",
      syncFrequency: "REALTIME",

      announcementEnabled: announcementConfig.enabled,
      announcementBadgeText: announcementConfig.badgeText,
      announcementText: announcementConfig.text,
      announcementType: announcementConfig.type,
      announcementSpeed: announcementConfig.speed
    };

    const [settings, setSettings] = useState(defaultSettings);

    const handleToggle = (key) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, val) => {
      setSettings((prev) => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
      const updatedConfig = {
        enabled: settings.announcementEnabled,
        badgeText: settings.announcementBadgeText,
        text: settings.announcementText,
        type: settings.announcementType,
        speed: settings.announcementSpeed
      };
      setAnnouncementConfig(updatedConfig);
      if (typeof window !== "undefined") {
        localStorage.setItem("gem_announcement_config", JSON.stringify(updatedConfig));
      }
      setShowSaveConfirm(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    };

    const handleReset = () => {
      setSettings(defaultSettings);
      setShowResetConfirm(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 4000);
    };

    const categories = [
      { id: "general", label: "General Settings", icon: Settings, desc: "Platform name, timezone & language" },
      { id: "announcements", label: "Live Announcements", icon: Megaphone, desc: "Control live scrolling ticker & alerts" },
      { id: "security", label: "Security & Auth", icon: ShieldCheck, desc: "Password policy, 2FA & IP limits" },
      { id: "ai", label: "AI Configuration", icon: Cpu, desc: "Engine models, OCR & risk scoring" },
      { id: "notifications", label: "Notification Alerts", icon: Bell, desc: "Email notifications & high-risk alerts" },
      { id: "compliance", label: "Compliance Rules", icon: FileText, desc: "Risk thresholds & mandatory policies" },
      { id: "storage", label: "Data & Storage", icon: Database, desc: "Retention policy & backups" },
      { id: "integrations", label: "Integration Settings", icon: Sliders, desc: "API gateway, timeouts & retries" }
    ];

    const inputStyle = {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      background: "#ffffff",
      color: "#0f172a",
      fontSize: "0.88rem",
      fontWeight: 600,
      outline: "none",
      boxSizing: "border-box"
    };

    const labelStyle = {
      display: "block",
      fontSize: "0.82rem",
      fontWeight: 700,
      color: "#334155",
      marginBottom: "6px"
    };

    const ToggleSwitch = ({ checked, onChange, label, subtext }) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>{label}</div>
          {subtext && <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>{subtext}</div>}
        </div>
        <button
          type="button"
          onClick={onChange}
          style={{
            width: "48px",
            height: "26px",
            borderRadius: "999px",
            background: checked ? "#2563eb" : "#cbd5e1",
            position: "relative",
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s ease",
            flexShrink: 0
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: checked ? "25px" : "3px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "left 0.2s ease"
            }}
          />
        </button>
      </div>
    );

    return (
      <div style={{ padding: "30px 40px", background: "#f8fafc", minHeight: "100vh" }}>
        {/* Save Confirmation Toast */}
        {saveToast && (
          <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 100000, background: "#0f172a", color: "#ffffff", padding: "14px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", borderLeft: "4px solid #10b981" }}>
            <CheckCircle2 size={20} style={{ color: "#10b981" }} />
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800 }}>System Settings Saved Successfully</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>All security and AI governance policies updated across live nodes.</div>
            </div>
          </div>
        )}

        {/* Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "10px", borderRadius: "10px", background: "#dbeafe", color: "#2563eb" }}>
                <Settings size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
                  SYSTEM SETTINGS
                </h1>
                <p style={{ fontSize: "0.88rem", color: "#475569", margin: "4px 0 0 0" }}>
                  Configure platform preferences, security, notifications and AI verification settings.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
            >
              <RotateCcw size={16} />
              Reset to Default
            </button>
            <button
              onClick={() => setShowSaveConfirm(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#ffffff", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)" }}
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Left Navigation Sidebar */}
          <div style={{ width: "300px", flexShrink: 0 }}>
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              {categories.map(({ id, label, icon: IconComponent, desc }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "transparent",
                      color: isActive ? "#1d4ed8" : "#334155",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: "6px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ padding: "8px", borderRadius: "8px", background: isActive ? "#ffffff" : "#f1f5f9", color: isActive ? "#2563eb" : "#64748b", boxShadow: isActive ? "0 2px 6px rgba(37,99,235,0.15)" : "none" }}>
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: isActive ? 800 : 700 }}>{label}</div>
                      <div style={{ fontSize: "0.72rem", color: isActive ? "#2563eb" : "#94a3b8", marginTop: "2px" }}>{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Active Form Panel */}
          <div style={{ flex: 1 }}>
            <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>

              {/* 1. GENERAL SETTINGS */}
              {activeTab === "general" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>GENERAL SETTINGS</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Configure platform identification, regional parameters, and operational metadata.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle}>Platform Name</label>
                      <input
                        type="text"
                        value={settings.platformName}
                        onChange={(e) => handleChange("platformName", e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Organization</label>
                      <input
                        type="text"
                        value={settings.organization}
                        onChange={(e) => handleChange("organization", e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Department</label>
                      <input
                        type="text"
                        value={settings.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Time Zone</label>
                      <select
                        value={settings.timeZone}
                        onChange={(e) => handleChange("timeZone", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="IST">(UTC+05:30) India Standard Time (IST)</option>
                        <option value="UTC">(UTC+00:00) Coordinated Universal Time (UTC)</option>
                        <option value="EST">(UTC-05:00) Eastern Standard Time (EST)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Date Format</label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleChange("dateFormat", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 30/08/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-30)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/30/2026)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange("language", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="en-IN">English (India)</option>
                        <option value="hi-IN">Hindi (हिंदी)</option>
                        <option value="ta-IN">Tamil (தமிழ்)</option>
                        <option value="bn-IN">Bengali (বাংলা)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE ANNOUNCEMENTS GOVERNANCE */}
              {activeTab === "announcements" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>LIVE ANNOUNCEMENTS & TICKER GOVERNANCE</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Control real-time scrolling announcement tickers, broadcast emergency compliance alerts, and customize portal notice themes.</p>
                  </div>

                  <ToggleSwitch
                    checked={settings.announcementEnabled}
                    onChange={() => handleToggle("announcementEnabled")}
                    label="Live Announcement Ticker Enabled"
                    subtext="Display the scrolling live announcement banner across all procurement officer and bidder portal views."
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
                    <div>
                      <label style={labelStyle}>Announcement Badge Title</label>
                      <input
                        type="text"
                        value={settings.announcementBadgeText}
                        onChange={(e) => handleChange("announcementBadgeText", e.target.value)}
                        placeholder="e.g. 📢 LIVE ANNOUNCEMENTS"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Announcement Alert Level & Theme</label>
                      <select
                        value={settings.announcementType}
                        onChange={(e) => handleChange("announcementType", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="NOTICE">Notice (Navy Blue - Standard)</option>
                        <option value="CRITICAL">Critical (Crimson Red - Emergency)</option>
                        <option value="WARNING">Warning (Amber Orange - System Alert)</option>
                        <option value="SUCCESS">Success (Emerald Green - Broadcast)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle}>Broadcast Announcement Message Text</label>
                      <textarea
                        rows={3}
                        value={settings.announcementText}
                        onChange={(e) => handleChange("announcementText", e.target.value)}
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                        placeholder="Enter scrolling announcement text..."
                      />
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "block" }}>Use ✦ separator symbols for clean multi-topic scrolling announcements.</span>
                    </div>

                    <div>
                      <label style={labelStyle}>Ticker Scroll Speed</label>
                      <select
                        value={settings.announcementSpeed}
                        onChange={(e) => handleChange("announcementSpeed", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="NORMAL">Normal Speed (28 Seconds)</option>
                        <option value="SLOW">Slow Speed (45 Seconds - High Readability)</option>
                        <option value="FAST">Fast Speed (15 Seconds - Rapid Scroll)</option>
                      </select>
                    </div>
                  </div>

                  {/* REAL-TIME PREVIEW BOX */}
                  <div style={{ marginTop: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "16px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Radio size={16} style={{ color: "#2563eb" }} />
                        <span>LIVE PREVIEW (REAL-TIME ANIMATION)</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", background: settings.announcementEnabled ? "#dcfce7" : "#fee2e2", color: settings.announcementEnabled ? "#15803d" : "#b91c1c", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                        {settings.announcementEnabled ? "● BROADCASTING LIVE" : "○ TICKER OFF"}
                      </span>
                    </div>

                    {settings.announcementEnabled ? (
                      <div
                        className="gov-ticker-bar"
                        style={{
                          borderRadius: "8px",
                          padding: "6px 14px",
                          background:
                            settings.announcementType === "CRITICAL"
                              ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
                              : settings.announcementType === "WARNING"
                                ? "linear-gradient(90deg, #78350f 0%, #92400e 100%)"
                                : settings.announcementType === "SUCCESS"
                                  ? "linear-gradient(90deg, #064e3b 0%, #047857 100%)"
                                  : "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)"
                        }}
                      >
                        <span className="ticker-badge">
                          {settings.announcementBadgeText || "📢 LIVE ANNOUNCEMENTS"}
                        </span>
                        <div className="ticker-wrapper">
                          <span
                            key={`${settings.announcementSpeed}-${settings.announcementText}`}
                            className="ticker-text"
                            style={{
                              animationDuration:
                                settings.announcementSpeed === "SLOW"
                                  ? "45s"
                                  : settings.announcementSpeed === "FAST"
                                    ? "15s"
                                    : "28s"
                            }}
                          >
                            {settings.announcementText || "No active announcement text entered."}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, textAlign: "center" }}>
                        ⚠️ Live Announcement Ticker is currently Disabled (Banner hidden across portal)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. SECURITY & AUTH */}
              {activeTab === "security" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>SECURITY & AUTHENTICATION</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Enforce password rules, multi-factor authentication, session governance, and IP allowlists.</p>
                  </div>

                  <ToggleSwitch
                    checked={settings.twoFactorAuth}
                    onChange={() => handleToggle("twoFactorAuth")}
                    label="Two-Factor Authentication (2FA)"
                    subtext="Require TOTP / SMS OTP authentication for all Super Admin and Procurement Officer logins."
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
                    <div>
                      <label style={labelStyle}>Password Policy</label>
                      <select
                        value={settings.passwordPolicy}
                        onChange={(e) => handleChange("passwordPolicy", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="STRICT">Strict (Min 12 chars, Uppercase, Numbers, Special Symbols)</option>
                        <option value="MEDIUM">Medium (Min 8 chars, Alphanumeric)</option>
                        <option value="STANDARD">Standard (Min 8 chars)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Session Timeout (Minutes)</label>
                      <select
                        value={settings.sessionTimeout}
                        onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="15">15 Minutes (High Security)</option>
                        <option value="30">30 Minutes (Recommended)</option>
                        <option value="60">60 Minutes</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Login Attempt Limit</label>
                      <select
                        value={settings.loginAttemptLimit}
                        onChange={(e) => handleChange("loginAttemptLimit", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="3">3 Failed Attempts (Strict Lockout)</option>
                        <option value="5">5 Failed Attempts (Standard Lockout)</option>
                        <option value="10">10 Failed Attempts</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle}>IP Restrictions & Allowlisted Subnets</label>
                      <input
                        type="text"
                        value={settings.ipRestrictions}
                        onChange={(e) => handleChange("ipRestrictions", e.target.value)}
                        style={inputStyle}
                      />
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "block" }}>Comma-separated CIDR subnets allowed to access administrative endpoints.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. AI CONFIGURATION */}
              {activeTab === "ai" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>AI VERIFICATION ENGINE CONFIGURATION</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Control deep document analysis, OCR extraction, legal name mismatch detection, and risk scoring algorithms.</p>
                  </div>

                  <ToggleSwitch
                    checked={settings.aiVerificationEnabled}
                    onChange={() => handleToggle("aiVerificationEnabled")}
                    label="AI Verification Engine Enabled"
                    subtext="Enable automated real-time document extraction and compliance verification across all incoming bids."
                  />

                  <ToggleSwitch
                    checked={settings.documentAnalysis}
                    onChange={() => handleToggle("documentAnalysis")}
                    label="Multilingual OCR Document Analysis"
                    subtext="Extract GST, PAN, Bank Solvency, and Turnover data from PDF and scanned image attachments."
                  />

                  <ToggleSwitch
                    checked={settings.mismatchDetection}
                    onChange={() => handleToggle("mismatchDetection")}
                    label="Fuzzy Entity Mismatch Detection"
                    subtext="Cross-reference bidder legal names with Income Tax and GSTN databases using Levenshtein distance matching."
                  />

                  <ToggleSwitch
                    checked={settings.riskScoring}
                    onChange={() => handleToggle("riskScoring")}
                    label="Multi-Factor Algorithmic Risk Assessment"
                    subtext="Generate automated risk score percentage (0-100%) based on historical compliance and registry alerts."
                  />

                  <ToggleSwitch
                    checked={settings.aiRecommendation}
                    onChange={() => handleToggle("aiRecommendation")}
                    label="AI Recommendation Model"
                    subtext="Provide automated Qualification / Manual Review recommendations to Procurement Officers."
                  />

                  <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>AI Minimum Confidence Threshold</label>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#2563eb", background: "#dbeafe", padding: "2px 10px", borderRadius: "6px" }}>
                        {settings.confidenceThreshold}% Minimum
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      value={settings.confidenceThreshold}
                      onChange={(e) => handleChange("confidenceThreshold", e.target.value)}
                      style={{ width: "100%", accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Verifications scoring below {settings.confidenceThreshold}% confidence will automatically flag a mandatory manual review.</span>
                  </div>
                </div>
              )}

              {/* 4. NOTIFICATION SETTINGS */}
              {activeTab === "notifications" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>NOTIFICATION & ALERT SETTINGS</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Manage real-time officer dispatch alerts, SMS notifications, and system integration event logs.</p>
                  </div>

                  <ToggleSwitch
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle("emailNotifications")}
                    label="Global Email Notifications"
                    subtext="Send automated email dispatches to registered officers upon major compliance events."
                  />

                  <ToggleSwitch
                    checked={settings.bidVerificationAlerts}
                    onChange={() => handleToggle("bidVerificationAlerts")}
                    label="Bid Verification Completion Alerts"
                    subtext="Dispatch notification whenever AI finishes parsing a submitted tender bid."
                  />

                  <ToggleSwitch
                    checked={settings.highRiskAlerts}
                    onChange={() => handleToggle("highRiskAlerts")}
                    label="High-Risk Bid Escalation Alerts"
                    subtext="Trigger immediate SMS & Email alerts when a bid generates a risk score over 65%."
                  />

                  <ToggleSwitch
                    checked={settings.failedIntegrationAlerts}
                    onChange={() => handleToggle("failedIntegrationAlerts")}
                    label="Government Registry API Failure Alerts"
                    subtext="Notify platform administrators if connections to GST, PAN, or MSME gateways drop."
                  />

                  <ToggleSwitch
                    checked={settings.auditAlerts}
                    onChange={() => handleToggle("auditAlerts")}
                    label="Administrative Override Audit Alerts"
                    subtext="Log and notify security team when an officer overrides an automated AI rejection."
                  />
                </div>
              )}

              {/* 5. COMPLIANCE SETTINGS */}
              {activeTab === "compliance" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>COMPLIANCE & GOVERNANCE RULES</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Define default risk boundaries, mandatory document policies, and automatic re-verification schedules.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>Default Risk Escalation Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.defaultRiskThreshold}
                        onChange={(e) => handleChange("defaultRiskThreshold", e.target.value)}
                        style={inputStyle}
                      />
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "block" }}>Bids exceeding this risk percentage are automatically routed to manual review.</span>
                    </div>

                    <div>
                      <label style={labelStyle}>Compliance Qualification Threshold (%)</label>
                      <input
                        type="number"
                        value={settings.complianceScoreThreshold}
                        onChange={(e) => handleChange("complianceScoreThreshold", e.target.value)}
                        style={inputStyle}
                      />
                      <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "block" }}>Minimum score required for automated qualification clearance.</span>
                    </div>

                    <div>
                      <label style={labelStyle}>Mandatory Document Enforcement Policy</label>
                      <select
                        value={settings.mandatoryDocPolicy}
                        onChange={(e) => handleChange("mandatoryDocPolicy", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="STRICT">Strict (GST, PAN, Solvency, Turnover & OEM Certificates mandatory)</option>
                        <option value="STANDARD">Standard (GST, PAN & Solvency mandatory)</option>
                        <option value="FLEXIBLE">Flexible (Allow provisional upload with 48h cure period)</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
                      <ToggleSwitch
                        checked={settings.autoReverification}
                        onChange={() => handleToggle("autoReverification")}
                        label="Automated Periodic Re-Verification"
                        subtext="Re-check active supplier GSTIN status and blacklisting records every 30 days automatically."
                      />

                      <ToggleSwitch
                        checked={settings.tenderSpecificRules}
                        onChange={() => handleToggle("tenderSpecificRules")}
                        label="Tender-Specific Override Eligibility Rules"
                        subtext="Allow Procurement Officers to append custom criteria to specific high-value tenders."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. DATA & STORAGE */}
              {activeTab === "storage" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>DATA RETENTION & STORAGE GOVERNANCE</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Manage CPPP document retention mandates, audit log permanence, and NIC sovereign cloud backup intervals.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>Document Retention Policy</label>
                      <select
                        value={settings.docRetention}
                        onChange={(e) => handleChange("docRetention", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="7_YEARS">7 Years (CPPP & GeM Sovereign Procurement Policy)</option>
                        <option value="10_YEARS">10 Years (Extended Audit Retention)</option>
                        <option value="INDEFINITE">Indefinite Permanent Storage</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Audit Log Retention</label>
                      <select
                        value={settings.auditRetention}
                        onChange={(e) => handleChange("auditRetention", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="INDEFINITE">Indefinite (Immutable SHA-256 Cryptographic Ledger)</option>
                        <option value="7_YEARS">7 Years Archive</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Sovereign Cloud Backup Frequency</label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => handleChange("backupFrequency", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="HOURLY">Hourly Automated Snapshot (NIC Cloud)</option>
                        <option value="DAILY">Daily Midnight Backup</option>
                        <option value="WEEKLY">Weekly Full System Dump</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Export Data Format</label>
                      <select
                        value={settings.dataExportFormat}
                        onChange={(e) => handleChange("dataExportFormat", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="ALL">JSON, CSV, & Digitally Signed PDF Formats</option>
                        <option value="PDF">Digitally Signed PDF Audit Packages Only</option>
                        <option value="CSV">CSV Data Export Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. INTEGRATION SETTINGS */}
              {activeTab === "integrations" && (
                <div>
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>GOVERNMENT INTEGRATION & API CONFIGURATION</h2>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "4px 0 0 0" }}>Configure connection parameters, retry backoff algorithms, and synchronization frequencies for government gateways.</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle}>Primary Production API Gateway Endpoint</label>
                      <input
                        type="text"
                        value={settings.apiEndpoint}
                        onChange={(e) => handleChange("apiEndpoint", e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Connection Timeout (Milliseconds)</label>
                      <select
                        value={settings.connectionTimeout}
                        onChange={(e) => handleChange("connectionTimeout", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="3000">3000 ms (3 Seconds)</option>
                        <option value="5000">5000 ms (5 Seconds - Standard)</option>
                        <option value="10000">10000 ms (10 Seconds)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Retry Attempt Strategy</label>
                      <select
                        value={settings.retryAttempts}
                        onChange={(e) => handleChange("retryAttempts", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="3">3 Exponential Backoff Retries (Recommended)</option>
                        <option value="5">5 Retries (High Tolerance)</option>
                        <option value="1">1 Immediate Retry Only</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <label style={labelStyle}>Registry Synchronization Frequency</label>
                      <select
                        value={settings.syncFrequency}
                        onChange={(e) => handleChange("syncFrequency", e.target.value)}
                        style={inputStyle}
                      >
                        <option value="REALTIME">Real-Time (Event-Driven Webhooks)</option>
                        <option value="EVERY_15_MIN">Every 15 Minutes Batch Sync</option>
                        <option value="HOURLY">Hourly Batch Sync</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SENSITIVE CONFIGURATION WARNING BOX */}
              <div style={{ marginTop: "32px", padding: "16px 20px", borderRadius: "12px", background: "#fffbe6", border: "1px solid #fde68a", borderLeft: "4px solid #f59e0b", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <AlertTriangle size={22} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#92400e" }}>
                    Sovereign Security & AI Governance Notice
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#b45309", marginTop: "3px", lineHeight: 1.5 }}>
                    Modifying core AI risk scoring thresholds, security policies, or IP restrictions will immediately take effect across all active GeM procurement verifications. Ensure proper clearance from the Chief Compliance Auditor before saving configuration changes.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* CONFIRMATION DIALOG MODAL FOR SAVE */}
        {showSaveConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "480px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)", borderTop: "4px solid #2563eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <ShieldCheck size={24} style={{ color: "#2563eb" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Confirm System Settings Update
                </h3>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                Are you sure you want to commit these system configuration changes? Updated parameters will take effect immediately across live verification nodes.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  Confirm & Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION DIALOG MODAL FOR RESET */}
        {showResetConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "480px", maxWidth: "90%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)", borderTop: "4px solid #d97706" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <AlertTriangle size={24} style={{ color: "#d97706" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                  Reset Settings to Default Parameters?
                </h3>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
                This action will restore all platform preferences, security limits, AI confidence thresholds, and notification rules back to their factory default values.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#d97706", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  Reset Parameters
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // Blacklisted & Debarred Bidders Governance Console View Component
  const BlacklistedBiddersView = () => {
    const [blacklistedList, setBlacklistedList] = useState(INITIAL_BLACKLISTED_BIDDERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [selectedDossier, setSelectedDossier] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(null);
    const [toastMessage, setToastMessage] = useState("");

    // Form state for adding a new blacklisted entity
    const [newEntity, setNewEntity] = useState({
      name: "",
      pan: "",
      gstin: "",
      type: "Private Limited",
      reason: "",
      violationCategory: "Document Forgery & Fraud",
      debarmentOrderNo: "",
      authority: "Central Vigilance Commission (CVC)",
      duration: "3 Years",
      severity: "CRITICAL",
      notes: ""
    });
    const [adminPasswordInput, setAdminPasswordInput] = useState("");
    const [modalError, setModalError] = useState("");

    const triggerToast = (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(""), 4000);
    };

    const handleAddBlacklistSubmit = (e) => {
      e.preventDefault();
      if (!newEntity.name || !newEntity.pan || !newEntity.reason || !newEntity.debarmentOrderNo) {
        setModalError("Please complete all required fields (Name, PAN, Reason, Order No).");
        return;
      }
      if (adminPasswordInput !== "admin123" && adminPasswordInput !== "officer123" && adminPasswordInput !== "123456") {
        setModalError("Invalid Security Password. Authorization denied.");
        return;
      }

      const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const createdItem = {
        id: `BLK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        name: newEntity.name,
        pan: newEntity.pan.toUpperCase(),
        gstin: newEntity.gstin.toUpperCase() || "N/A",
        type: newEntity.type,
        reason: newEntity.reason,
        violationCategory: newEntity.violationCategory,
        debarmentOrderNo: newEntity.debarmentOrderNo,
        authority: newEntity.authority,
        startDate: todayStr,
        endDate: "Active Debarment Period",
        duration: newEntity.duration,
        severity: newEntity.severity,
        status: "Active Debarment",
        statusBg: "#fef2f2",
        statusColor: "#dc2626",
        contactEmail: "legal@registered-entity.in",
        contactPhone: "+91 98000 11223",
        investigationHash: "0x" + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase(),
        notes: newEntity.notes || "Debarred by central compliance authority following automated integrity flag."
      };

      setBlacklistedList([createdItem, ...blacklistedList]);
      setShowAddModal(false);
      setNewEntity({
        name: "",
        pan: "",
        gstin: "",
        type: "Private Limited",
        reason: "",
        violationCategory: "Document Forgery & Fraud",
        debarmentOrderNo: "",
        authority: "Central Vigilance Commission (CVC)",
        duration: "3 Years",
        severity: "CRITICAL",
        notes: ""
      });
      setAdminPasswordInput("");
      setModalError("");
      triggerToast(`Entity "${createdItem.name}" successfully committed to Blacklist Registry.`);
    };

    const handleRevokeDebarment = () => {
      if (adminPasswordInput !== "admin123" && adminPasswordInput !== "officer123" && adminPasswordInput !== "123456") {
        setModalError("Invalid Security Password. Authorization denied.");
        return;
      }

      setBlacklistedList(blacklistedList.filter(b => b.id !== showRevokeModal.id));
      triggerToast(`Debarment order for "${showRevokeModal.name}" revoked & reinstated.`);
      setShowRevokeModal(null);
      setAdminPasswordInput("");
      setModalError("");
    };

    const filtered = blacklistedList.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.pan.toLowerCase().includes(q) ||
        item.gstin.toLowerCase().includes(q) ||
        item.debarmentOrderNo.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || item.violationCategory === categoryFilter;
      const matchesSeverity = severityFilter === "All" || item.severity === severityFilter;
      return matchesSearch && matchesCategory && matchesSeverity;
    });

    const criticalCount = blacklistedList.filter(i => i.severity === "CRITICAL").length;
    const highCount = blacklistedList.filter(i => i.severity === "HIGH").length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#f8fafc", padding: "4px" }}>
        
        {/* HEADER BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800, background: "#fee2e2", color: "#dc2626", textTransform: "uppercase" }}>
                SOVEREIGN GOVERNANCE CONSOLE
              </span>
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserX size={24} style={{ color: "#dc2626" }} /> Blacklisted & Debarred Bidders Registry
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
              Central administrative registry of blacklisted entities, vigilance debarment orders, and fraud prevention locks.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => {
                triggerToast("Debarment Registry exported as official PDF compliance document.");
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 14px", fontSize: "0.82rem", fontWeight: 700, color: "#334155", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              <Download size={14} /> Export Registry (PDF)
            </button>

            {isAdmin && (
              <button
                onClick={() => { setShowAddModal(true); setModalError(""); setAdminPasswordInput(""); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 6px rgba(220,38,38,0.25)" }}
              >
                <Plus size={15} /> Add Entity to Blacklist
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserX size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>TOTAL DEBARRED BIDDERS</span>
              <strong style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0f172a" }}>{blacklistedList.length} Entities</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fef2f2", color: "#b91c1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>CRITICAL SEVERITY OFFENSES</span>
              <strong style={{ fontSize: "1.4rem", fontWeight: 900, color: "#dc2626" }}>{criticalCount} Severe Cases</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#fff7ed", color: "#c2410c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>HIGH RISK VIOLATIONS</span>
              <strong style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ea580c" }}>{highCount} Violations</strong>
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>AUTOMATED BLOCK STATUS</span>
              <strong style={{ fontSize: "1.2rem", fontWeight: 800, color: "#15803d" }}>100% Locked</strong>
            </div>
          </div>

        </div>

        {/* SEARCH & FILTERS BAR */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search by company name, PAN, GSTIN, Order No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.82rem", background: "#ffffff", color: "#0f172a", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Violation Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", background: "#ffffff", color: "#0f172a", fontWeight: 600 }}
              >
                <option value="All">All Offenses</option>
                <option value="Document Forgery & Fraud">Document Forgery & Fraud</option>
                <option value="Cartelization & Collusion">Cartelization & Collusion</option>
                <option value="Financial & EMD Default">Financial & EMD Default</option>
                <option value="Misrepresentation">Misrepresentation</option>
                <option value="Integrity Pact Violation">Integrity Pact Violation</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.78rem", background: "#ffffff", color: "#0f172a", fontWeight: 600 }}
              >
                <option value="All">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            {(searchQuery || categoryFilter !== "All" || severityFilter !== "All") && (
              <button
                onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setSeverityFilter("All"); }}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", fontSize: "0.78rem", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Reset Filters
              </button>
            )}
          </div>

        </div>

        {/* TABLE LISTING */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "14px 16px" }}>Debarred Entity</th>
                  <th style={{ padding: "14px 16px" }}>Statutory Identifiers</th>
                  <th style={{ padding: "14px 16px" }}>Violation Reason & Offense</th>
                  <th style={{ padding: "14px 16px" }}>Vigilance Order & Authority</th>
                  <th style={{ padding: "14px 16px" }}>Duration</th>
                  <th style={{ padding: "14px 16px" }}>Severity</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    
                    {/* Column 1: Entity */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.82rem", border: "1px solid #fecaca" }}>
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{item.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>ID: {item.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Identifiers */}
                    <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "#475569" }}>
                      <div>PAN: <strong style={{ color: "#0f172a" }}>{item.pan}</strong></div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>GSTIN: {item.gstin}</div>
                    </td>

                    {/* Column 3: Offense */}
                    <td style={{ padding: "14px 16px", maxWidth: "260px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 800, background: "#fee2e2", color: "#b91c1c", display: "inline-block", marginBottom: "4px" }}>
                        {item.violationCategory}
                      </span>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", lineHeight: 1.35 }}>
                        {item.reason}
                      </p>
                    </td>

                    {/* Column 4: Vigilance Authority */}
                    <td style={{ padding: "14px 16px", fontSize: "0.78rem" }}>
                      <strong style={{ color: "#0f172a", display: "block" }}>{item.debarmentOrderNo}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.72rem" }}>{item.authority}</span>
                    </td>

                    {/* Column 5: Duration */}
                    <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "#475569" }}>
                      <strong style={{ color: "#dc2626", display: "block" }}>{item.duration}</strong>
                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Since {item.startDate}</span>
                    </td>

                    {/* Column 6: Severity */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 800, background: item.severity === "CRITICAL" ? "#fef2f2" : "#fff7ed", color: item.severity === "CRITICAL" ? "#dc2626" : "#c2410c", border: item.severity === "CRITICAL" ? "1px solid #fecaca" : "1px solid #ffedd5" }}>
                        ● {item.severity}
                      </span>
                    </td>

                    {/* Column 7: Actions */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          title="View Debarment Investigation Dossier"
                          onClick={() => setSelectedDossier(item)}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            title="Revoke Debarment / Reinstate Entity"
                            onClick={() => { setShowRevokeModal(item); setModalError(""); setAdminPasswordInput(""); }}
                            style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: "0.85rem" }}>
                      No blacklisted bidders found matching the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: INVESTIGATION DOSSIER */}
        {selectedDossier && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "580px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #cbd5e1" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldAlert size={24} style={{ color: "#dc2626" }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>Debarment Dossier: {selectedDossier.name}</h2>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Registry Ref: {selectedDossier.id} | Order No: {selectedDossier.debarmentOrderNo}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedDossier(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer", fontWeight: 800 }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>OFFENSE & VIOLATION SUMMARY</span>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#b91c1c", margin: "2px 0 6px 0" }}>{selectedDossier.violationCategory}</h4>
                  <p style={{ fontSize: "0.82rem", color: "#7f1d1d", margin: 0, lineHeight: 1.4 }}>{selectedDossier.reason}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.8rem" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>PAN Number</span>
                    <strong style={{ color: "#0f172a" }}>{selectedDossier.pan}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>GSTIN Identifier</span>
                    <strong style={{ color: "#0f172a" }}>{selectedDossier.gstin}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Sanctioning Authority</span>
                    <strong style={{ color: "#0f172a" }}>{selectedDossier.authority}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>Debarment Term</span>
                    <strong style={{ color: "#dc2626" }}>{selectedDossier.duration} ({selectedDossier.startDate})</strong>
                  </div>
                </div>

                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>VIGILANCE AUDITOR INVESTIGATION NOTES</span>
                  <p style={{ fontSize: "0.8rem", color: "#334155", margin: 0, lineHeight: 1.45 }}>{selectedDossier.notes}</p>
                </div>

                <div style={{ background: "#0f172a", color: "#38bdf8", padding: "10px 14px", borderRadius: "8px", fontFamily: "monospace", fontSize: "0.72rem" }}>
                  Cryptographic Audit Hash: {selectedDossier.investigationHash}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                  <button onClick={() => setSelectedDossier(null)} style={{ background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", padding: "8px 20px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                    Close Dossier
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: ADD ENTITY TO BLACKLIST (ADMIN ONLY) */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "600px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", borderTop: "4px solid #dc2626" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <UserX size={22} style={{ color: "#dc2626" }} />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>Blacklist New Entity</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleAddBlacklistSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {modalError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "8px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700 }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Company / Entity Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Infra Ltd"
                      value={newEntity.name}
                      onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>PAN Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AABCA1234A"
                      value={newEntity.pan}
                      onChange={(e) => setNewEntity({ ...newEntity, pan: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>GSTIN Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. 24AABCA1234A1Z5"
                      value={newEntity.gstin}
                      onChange={(e) => setNewEntity({ ...newEntity, gstin: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Violation Category</label>
                    <select
                      value={newEntity.violationCategory}
                      onChange={(e) => setNewEntity({ ...newEntity, violationCategory: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    >
                      <option value="Document Forgery & Fraud">Document Forgery & Fraud</option>
                      <option value="Cartelization & Collusion">Cartelization & Collusion</option>
                      <option value="Financial & EMD Default">Financial & EMD Default</option>
                      <option value="Misrepresentation">Misrepresentation</option>
                      <option value="Integrity Pact Violation">Integrity Pact Violation</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Vigilance Order No *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CVC/DEBAR/2026/099"
                      value={newEntity.debarmentOrderNo}
                      onChange={(e) => setNewEntity({ ...newEntity, debarmentOrderNo: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Debarment Duration</label>
                    <select
                      value={newEntity.duration}
                      onChange={(e) => setNewEntity({ ...newEntity, duration: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                    >
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                      <option value="5 Years">5 Years</option>
                      <option value="Permanent">Permanent / Lifetime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Offense Summary & Reason *</label>
                  <textarea
                    required
                    placeholder="Provide specific details of the non-compliance or fraud..."
                    value={newEntity.reason}
                    onChange={(e) => setNewEntity({ ...newEntity, reason: e.target.value })}
                    rows={2}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                  />
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "8px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#dc2626", marginBottom: "4px" }}>🔒 Admin Security Authorization Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter Admin Password (admin123)"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ background: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 20px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}>Authorize & Commit to Blacklist</button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* MODAL 3: REVOKE DEBARMENT CONFIRMATION */}
        {showRevokeModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)", borderTop: "4px solid #0284c7" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <RotateCcw size={22} style={{ color: "#0284c7" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Revoke Debarment Order?</h3>
              </div>
              
              <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.45, marginBottom: "14px" }}>
                Are you sure you want to revoke the debarment order for <strong>{showRevokeModal.name}</strong> ({showRevokeModal.pan})? Reinstating this entity will restore their eligibility to participate in GeM tenders.
              </p>

              {modalError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "8px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "12px" }}>
                  ⚠️ {modalError}
                </div>
              )}

              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#0284c7", marginBottom: "4px" }}>🔒 Admin Security Authorization Password *</label>
                <input
                  type="password"
                  placeholder="Enter Admin Password (admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.8rem", background: "#ffffff", color: "#0f172a" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowRevokeModal(null)} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleRevokeDebarment} style={{ background: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 20px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}>Confirm & Revoke Debarment</button>
              </div>

            </div>
          </div>
        )}

        {/* TOAST FEEDBACK */}
        {toastMessage && (
          <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999, background: "#0f172a", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
            <span>{toastMessage}</span>
          </div>
        )}

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
      case "userManagement":
        return <UserManagementView />;
      case "integrations":
        return <IntegrationsView />;
      case "blacklistedBidders":
        return <BlacklistedBiddersView />;
      case "auditTrail":
        return <AuditTrailView />;
      case "settings":
        return <SettingsView />;
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
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 12px)",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "14px",
                    padding: "10px",
                    minWidth: "220px",
                    boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)",
                    zIndex: 99999
                  }}
                >
                  <div style={{ padding: "8px 10px 12px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
                      {user ? user.full_name : "ABC Engineering Pvt. Ltd."}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                      {user?.email || "bidder@abcengineering.com"}
                    </div>
                  </div>

                  <button
                    className="dropdown-item"
                    onClick={() => { setActiveSection("profile"); setUserDropdownOpen(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: activeSection === "profile" ? "#f1f5f9" : "transparent",
                      color: activeSection === "profile" ? "#0f172a" : "#334155",
                      border: "none",
                      fontSize: "0.85rem",
                      fontWeight: activeSection === "profile" ? 800 : 600,
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: "4px"
                    }}
                  >
                    <User size={16} style={{ color: "#2563eb" }} />
                    <span>My Profile</span>
                  </button>

                  <div style={{ height: "1px", background: "#f1f5f9", margin: "6px 0" }} />

                  <button
                    className="dropdown-item signout-item"
                    onClick={() => { setUserDropdownOpen(false); onLogout(); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <LogOut size={16} style={{ color: "#dc2626" }} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Government Live Ticker Bar */}
        {announcementConfig.enabled && (
          <div
            className="gov-ticker-bar"
            style={{
              background:
                announcementConfig.type === "CRITICAL"
                  ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
                  : announcementConfig.type === "WARNING"
                    ? "linear-gradient(90deg, #78350f 0%, #92400e 100%)"
                    : announcementConfig.type === "SUCCESS"
                      ? "linear-gradient(90deg, #064e3b 0%, #047857 100%)"
                      : undefined
            }}
          >
            <span className="ticker-badge">{announcementConfig.badgeText || "📢 LIVE ANNOUNCEMENTS"}</span>
            <div className="ticker-wrapper">
              <span
                className="ticker-text"
                style={{
                  animationDuration:
                    announcementConfig.speed === "SLOW"
                      ? "45s"
                      : announcementConfig.speed === "FAST"
                        ? "15s"
                        : "28s"
                }}
              >
                {announcementConfig.text}
              </span>
            </div>
          </div>
        )}

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

          <div className="user-profile-dropdown" style={{ position: "relative" }}>
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "4px 8px", borderRadius: "8px" }}
            >
              <img src={profileImage} alt="User Profile" className="avatar-img" />
              <span className="company-name">{user ? user.full_name : "Procurement Officer"}</span>
              <ChevronDown size={14} className="dropdown-arrow" />
            </div>

            {userDropdownOpen && (
              <div
                className="dropdown-menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 12px)",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "14px",
                  padding: "10px",
                  minWidth: "240px",
                  boxShadow: "0 20px 30px -10px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)",
                  zIndex: 99999
                }}
              >
                {/* User Info Header */}
                <div style={{ padding: "8px 10px 12px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
                    {user ? user.full_name : "Admin User"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                    {user?.email || "admin@example.com"}
                  </div>
                  <div style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#0284c7",
                    marginTop: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    background: "#e0f2fe",
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "6px"
                  }}>
                    {isAdmin ? "Super Admin" : (role || "Procurement Officer")}
                  </div>
                </div>

                {/* My Profile */}
                <button
                  className="dropdown-item"
                  onClick={() => { setActiveSection("profile"); setUserDropdownOpen(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: activeSection === "profile" ? "#f1f5f9" : "transparent",
                    color: activeSection === "profile" ? "#0f172a" : "#334155",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: activeSection === "profile" ? 800 : 600,
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: "4px"
                  }}
                >
                  <User size={16} style={{ color: "#2563eb" }} />
                  <span>My Profile</span>
                </button>

                {/* Admin Management Links */}
                {isAdmin && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => { setActiveSection("userManagement"); setUserDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: activeSection === "userManagement" ? "#f1f5f9" : "transparent",
                        color: activeSection === "userManagement" ? "#0f172a" : "#334155",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: activeSection === "userManagement" ? 800 : 600,
                        cursor: "pointer",
                        textAlign: "left",
                        marginBottom: "4px"
                      }}
                    >
                      <Users size={16} style={{ color: "#9333ea" }} />
                      <span>User Management</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => { setActiveSection("integrations"); setUserDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: activeSection === "integrations" ? "#f1f5f9" : "transparent",
                        color: activeSection === "integrations" ? "#0f172a" : "#334155",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: activeSection === "integrations" ? 800 : 600,
                        cursor: "pointer",
                        textAlign: "left",
                        marginBottom: "4px"
                      }}
                    >
                      <Sliders size={16} style={{ color: "#0284c7" }} />
                      <span>Integrations</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => { setActiveSection("blacklistedBidders"); setUserDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: activeSection === "blacklistedBidders" ? "#fef2f2" : "transparent",
                        color: activeSection === "blacklistedBidders" ? "#dc2626" : "#334155",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: activeSection === "blacklistedBidders" ? 800 : 600,
                        cursor: "pointer",
                        textAlign: "left",
                        marginBottom: "4px"
                      }}
                    >
                      <UserX size={16} style={{ color: "#dc2626" }} />
                      <span>Blacklisted Bidders</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => { setActiveSection("settings"); setUserDropdownOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: activeSection === "settings" ? "#f1f5f9" : "transparent",
                        color: activeSection === "settings" ? "#0f172a" : "#334155",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: activeSection === "settings" ? 800 : 600,
                        cursor: "pointer",
                        textAlign: "left",
                        marginBottom: "4px"
                      }}
                    >
                      <Settings size={16} style={{ color: "#2563eb" }} />
                      <span>System Settings</span>
                    </button>
                  </>
                )}

                {/* Audit Trail */}
                <button
                  className="dropdown-item"
                  onClick={() => { setActiveSection("auditTrail"); setUserDropdownOpen(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: activeSection === "auditTrail" ? "#f1f5f9" : "transparent",
                    color: activeSection === "auditTrail" ? "#0f172a" : "#334155",
                    border: "none",
                    fontSize: "0.85rem",
                    fontWeight: activeSection === "auditTrail" ? 800 : 600,
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: "4px"
                  }}
                >
                  <ClipboardList size={16} style={{ color: "#16a34a" }} />
                  <span>Audit Trail</span>
                </button>

                <div style={{ height: "1px", background: "#f1f5f9", margin: "6px 0" }} />

                {/* Sign Out */}
                <button
                  className="dropdown-item signout-item"
                  onClick={() => { setUserDropdownOpen(false); onLogout(); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <LogOut size={16} style={{ color: "#dc2626" }} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Government Live Ticker Bar */}
      {announcementConfig.enabled && (
        <div
          className="gov-ticker-bar"
          style={{
            background:
              announcementConfig.type === "CRITICAL"
                ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
                : announcementConfig.type === "WARNING"
                  ? "linear-gradient(90deg, #78350f 0%, #92400e 100%)"
                  : announcementConfig.type === "SUCCESS"
                    ? "linear-gradient(90deg, #064e3b 0%, #047857 100%)"
                    : undefined
          }}
        >
          <span className="ticker-badge">{announcementConfig.badgeText || "📢 LIVE ANNOUNCEMENTS"}</span>
          <div className="ticker-wrapper">
            <span
              className="ticker-text"
              style={{
                animationDuration:
                  announcementConfig.speed === "SLOW"
                    ? "45s"
                    : announcementConfig.speed === "FAST"
                      ? "15s"
                      : "28s"
              }}
            >
              {announcementConfig.text}
            </span>
          </div>
        </div>
      )}

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