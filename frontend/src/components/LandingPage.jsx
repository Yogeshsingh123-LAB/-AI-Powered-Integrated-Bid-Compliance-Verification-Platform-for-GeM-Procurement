import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Play,
  FileSearch,
  Users,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  Building,
  Check,
  User,
  X,
  ExternalLink,
  HelpCircle,
  FileText
} from "lucide-react";
import "./LandingPage.css";

function LandingPage({ onOpenLogin, onOpenRegister, initialSection = "home", stats = {} }) {
  const [activeTab, setActiveTab] = useState(initialSection || "home");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (initialSection) {
      const timer = setTimeout(() => {
        scrollToSection(initialSection);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialSection]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How does BidVerify integrate with GeM procurement?",
      a: "BidVerify seamlessly cross-references tender document submissions against statutory government databases (PAN, GSTIN, Udyam MSME, EPFO/ESIC) to automate pre-qualification verification for GeM tenders."
    },
    {
      q: "Is BidVerify secure and compliant with government data standards?",
      a: "Yes. BidVerify uses end-to-end encryption, consent-driven API access, role-based access control (RBAC), and immutable audit logging for full legal transparency and compliance."
    },
    {
      q: "Can procurement officers override AI compliance recommendations?",
      a: "Absolutely. BidVerify is designed as an Officer Decision Support System. AI recommendations include clear explainability logs, but final authority always rests with designated procurement officers."
    },
    {
      q: "How long does automated bid verification take?",
      a: "Automated OCR extraction and statutory database verification complete in under 30 seconds per document batch, reducing manual evaluation effort by 60–80%."
    }
  ];

  return (
    <div className="bidverify-landing-container">
      {/* TOP NAVBAR */}
      <header className="landing-navbar">
        <div className="nav-content-wrapper">
          {/* Brand Logo */}
          <div className="brand-logo-container" onClick={() => scrollToSection("home")}>
            <img src="/logo.png" alt="BidVerify Logo" className="brand-logo-img" />
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            <button
              className={`nav-item ${activeTab === "home" ? "active" : ""}`}
              onClick={() => scrollToSection("home")}
            >
              Home
            </button>
            <button
              className={`nav-item ${activeTab === "about" ? "active" : ""}`}
              onClick={() => scrollToSection("about")}
            >
              About
            </button>
            <button
              className={`nav-item ${activeTab === "how-it-works" ? "active" : ""}`}
              onClick={() => scrollToSection("how-it-works")}
            >
              How It Works
            </button>
            <button
              className={`nav-item ${activeTab === "officers" ? "active" : ""}`}
              onClick={() => scrollToSection("officers")}
            >
              For Procurement Officers
            </button>
            <button
              className={`nav-item ${activeTab === "bidders" ? "active" : ""}`}
              onClick={() => scrollToSection("bidders")}
            >
              For Bidders
            </button>
            <button
              className={`nav-item ${activeTab === "faqs" ? "active" : ""}`}
              onClick={() => scrollToSection("faqs")}
            >
              FAQs
            </button>
          </nav>

          {/* Top Right Action Button (Get Started) */}
          <div className="nav-actions">
            <button className="btn-nav-get-started" onClick={() => onOpenLogin("login")}>
              <User size={15} />
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="hero-section">
        <div className="hero-background-overlay">
          <img
            src="/hero_government_building.jpg"
            alt="Rashtrapati Bhavan / Parliament House backdrop"
            className="hero-bg-img"
          />
          <div className="hero-dark-scrim"></div>
        </div>

        <div className="hero-container">
          {/* LEFT COLUMN */}
          <div className="hero-left-column">
            {/* Top Pill Badge */}
            <div className="hero-eyebrow-badge">
              <span className="badge-dot pulse-dot"></span>
              <span className="badge-primary-text">AI-POWERED BID COMPLIANCE PLATFORM</span>
              <span className="badge-divider">|</span>
              <span className="badge-sub-text">Trusted | Transparent | Government-Ready</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-main-title">
              Smarter Verification.<br />
              <span className="highlight-orange">Stronger Procurement.</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="hero-subtitle-description">
              BidVerify automates and simplifies bidder compliance verification for GeM procurement —
              helping procurement officers make faster, fairer and more transparent decisions.
            </p>

            {/* Hero Action Buttons (Get Started, Watch Demo) */}
            <div className="hero-cta-buttons-row">
              <button className="btn-hero-primary-orange" onClick={() => onOpenLogin("login")}>
                <Lock size={16} />
                Get Started <ArrowRight size={16} />
              </button>
              <button className="btn-hero-secondary-ghost" onClick={() => setShowDemoModal(true)}>
                <Play size={15} fill="currentColor" />
                Watch Demo
              </button>
            </div>

            {/* Micro Trust String */}
            <div className="hero-micro-trust">
              <span>No registration hassles</span>
              <span className="dot">•</span>
              <span>Secure & compliant</span>
              <span className="dot">•</span>
              <span>Built for Government</span>
            </div>

            {/* Feature Pills Bar */}
            <div className="hero-features-strip">
              <div className="feature-strip-item">
                <CheckCircle2 size={16} className="icon-emerald" />
                <span>Integrates with Government Portals</span>
              </div>
              <div className="feature-strip-item">
                <Sparkles size={16} className="icon-orange" />
                <span>AI-Powered Verification</span>
              </div>
              <div className="feature-strip-item">
                <CheckCircle2 size={16} className="icon-emerald" />
                <span>Compliant & Auditable</span>
              </div>
              <div className="feature-strip-item">
                <ShieldCheck size={16} className="icon-emerald" />
                <span>Secure & Consent-Driven</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN SHOWCASE */}
          <div className="hero-right-column">
            {/* Top Right Handwritten Script Overlay */}
            <div className="hero-script-overlay">
              <div className="script-lines">
                <span className="script-text">Faster</span>
                <span className="script-text">Fairer</span>
                <span className="script-text">Transparent</span>
              </div>
              <svg className="script-underline" viewBox="0 0 160 16" fill="none">
                <path d="M 10 10 Q 80 2 150 12" stroke="#ff6b2b" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            {/* Far Right Slogan */}
            <div className="atmanirbhar-slogan-box">
              <span className="slogan-line">FOR A</span>
              <span className="slogan-line">MORE EFFICIENT</span>
              <span className="slogan-line">ATMANIRBHAR</span>
              <span className="slogan-line">BHARAT</span>
              <div className="tricolor-stripe">
                <span className="saffron"></span>
                <span className="white"></span>
                <span className="green"></span>
              </div>
            </div>

            {/* Main Compliance Check Card */}
            <div className="compliance-card-widget">
              <div className="widget-card-header">
                <h3>Bidder Compliance Check</h3>
              </div>

              <div className="widget-card-body">
                {/* Left Side: Donut Meter */}
                <div className="score-donut-container">
                  <div className="donut-wrapper">
                    <svg className="donut-svg" viewBox="0 0 100 100">
                      <circle className="donut-bg" cx="50" cy="50" r="40" />
                      <circle
                        className="donut-fill"
                        cx="50"
                        cy="50"
                        r="40"
                        strokeDasharray="251.2"
                        strokeDashoffset="20"
                      />
                    </svg>
                    <div className="donut-center-content">
                      <span className="score-val">92%</span>
                    </div>
                  </div>
                  <span className="score-lbl">Compliance Score</span>
                  <span className="risk-pill-tag low-risk">✦ Low Risk</span>
                </div>

                {/* Right Side: Verification Checklist */}
                <div className="check-items-list">
                  <div className="check-row-item">
                    <div className="check-item-left">
                      <CheckCircle2 size={15} className="check-icon-valid" />
                      <span>PAN Verification</span>
                    </div>
                    <span className="status-badge-green">Verified</span>
                  </div>

                  <div className="check-row-item">
                    <div className="check-item-left">
                      <CheckCircle2 size={15} className="check-icon-valid" />
                      <span>GST Status</span>
                    </div>
                    <span className="status-badge-green">Verified</span>
                  </div>

                  <div className="check-row-item">
                    <div className="check-item-left">
                      <CheckCircle2 size={15} className="check-icon-valid" />
                      <span>Udyam Registration</span>
                    </div>
                    <span className="status-badge-green">Verified</span>
                  </div>

                  <div className="check-row-item">
                    <div className="check-item-left">
                      <CheckCircle2 size={15} className="check-icon-valid" />
                      <span>EPFO / ESIC</span>
                    </div>
                    <span className="status-badge-green">Verified</span>
                  </div>

                  <div className="check-row-item">
                    <div className="check-item-left">
                      <CheckCircle2 size={15} className="check-icon-valid" />
                      <span>OEM Authorization</span>
                    </div>
                    <span className="status-badge-orange">Needs Review</span>
                  </div>
                </div>
              </div>

              {/* Floating GeM Integration Subcard */}
              <div className="gem-integrated-subcard">
                <img src="/logo.png" alt="GeM Integration" className="gem-badge-img" />
                <div className="gem-badge-info">
                  <strong>Integrated</strong>
                  <span>for a stronger ecosystem</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: HOW BIDVERIFY BRIDGES THE GAP */}
      <section id="about" className="bridges-gap-section">
        <div className="section-header-center">
          <h2>
            How BidVerify <span className="highlight-orange">Bridges the Gap</span>
          </h2>
          <p className="section-subtitle">
            From fragmented documents to a unified compliance view — powered by AI.
          </p>
        </div>

        {/* 3 Feature Cards Grid */}
        <div className="gap-cards-grid">
          <div className="gap-feature-card">
            <div className="card-icon-box orange-box">
              <FileSearch size={26} />
            </div>
            <h3>Automated Verification</h3>
            <p>
              Fetch and verify bidder data from multiple government portals and documents using AI.
            </p>
          </div>

          <div className="gap-feature-card">
            <div className="card-icon-box orange-box">
              <ShieldCheck size={26} />
            </div>
            <h3>Compliance Scoring</h3>
            <p>
              Get an overall compliance score with risk classification and clear insights.
            </p>
          </div>

          <div className="gap-feature-card">
            <div className="card-icon-box orange-box">
              <Users size={26} />
            </div>
            <h3>Decision Support</h3>
            <p>
              AI-generated recommendations to help procurement officers make informed decisions.
            </p>
          </div>
        </div>

        {/* Impact Metric Banner */}
        <div className="impact-metric-banner">
          <div className="metric-col">
            <div className="metric-icon-wrap">
              <Users size={22} />
            </div>
            <div className="metric-details">
              <h3 className="metric-num">60–80%</h3>
              <p className="metric-label">Reduction in Verification Effort</p>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-col">
            <div className="metric-icon-wrap">
              <Clock size={22} />
            </div>
            <div className="metric-details">
              <h3 className="metric-num">3x</h3>
              <p className="metric-label">Faster Tender Evaluation</p>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-col">
            <div className="metric-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <div className="metric-details">
              <h3 className="metric-num">100%</h3>
              <p className="metric-label">Transparent & Auditable</p>
            </div>
          </div>

          <div className="metric-divider"></div>

          <div className="metric-col slogan-col">
            <span className="empower-slogan">Empowering Responsible Procurement</span>
            <div className="tricolor-wavy-line">
              <span className="strip saffron"></span>
              <span className="strip white"></span>
              <span className="strip green"></span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header-center">
          <span className="section-tag">WORKFLOW PIPELINE</span>
          <h2>Streamlined Verification in 4 Simple Steps</h2>
          <p className="section-subtitle">
            Designed to integrate directly into existing GeM procurement workflows without friction.
          </p>
        </div>

        <div className="steps-container-grid">
          <div className="step-card">
            <div className="step-number-badge">01</div>
            <h3>Document Upload</h3>
            <p>Bidders upload statutory qualification documents (GST, PAN, Udyam, Financial Audits, OEM Certificates).</p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">02</div>
            <h3>AI Extraction & OCR</h3>
            <p>Multilingual AI extracts key metadata, identifiers, financial tables, and compliance declarations automatically.</p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">03</div>
            <h3>Statutory Cross-Verification</h3>
            <p>Data is instantly verified against API mock gateways for GSTIN status, MSME validity, and blacklist databases.</p>
          </div>

          <div className="step-card">
            <div className="step-number-badge">04</div>
            <h3>Officer Decision Support</h3>
            <p>Procurement officers view unified risk scoring, automated cartel detection, and audit trail reports.</p>
          </div>
        </div>
      </section>

      {/* SECTION: FOR PROCUREMENT OFFICERS */}
      <section id="officers" className="portal-roles-section">
        <div className="role-grid-card">
          <div className="role-content">
            <span className="role-eyebrow">FOR PROCUREMENT OFFICERS</span>
            <h2>Make Confident, Defensible Procurement Decisions</h2>
            <p>
              BidVerify empowers government procurement officers with real-time audit tools, cartel pattern visualization,
              and explainable AI overrides.
            </p>
            <ul className="role-features-list">
              <li><CheckCircle2 size={16} className="icon-emerald" /> Automated risk scoring and flag classification</li>
              <li><CheckCircle2 size={16} className="icon-emerald" /> Interactive cartel detection & common ownership graph</li>
              <li><CheckCircle2 size={16} className="icon-emerald" /> Explainable Officer Override logs with full audit trail</li>
              <li><CheckCircle2 size={16} className="icon-emerald" /> Password-gated bidder blacklist controls</li>
            </ul>
            <button className="btn-role-action orange-btn" onClick={() => onOpenLogin("login")}>
              Access Officer Console <ArrowRight size={16} />
            </button>
          </div>
          <div className="role-visual-panel">
            <div className="mock-console-card">
              <div className="console-top-bar">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="console-title">Audit Terminal v1.0</span>
              </div>
              <div className="console-body">
                <div className="stat-pill-row">
                  <div className="mini-stat">
                    <span>ACTIVE TENDERS</span>
                    <strong>{stats?.activeTenders || 12}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>HIGH RISK BIDS</span>
                    <strong style={{ color: "#ef4444" }}>{stats?.highRiskBids !== undefined ? (stats.highRiskBids < 10 ? `0${stats.highRiskBids}` : stats.highRiskBids) : "02"}</strong>
                  </div>
                </div>
                <div className="audit-log-line green">✔ GSTIN & PAN match confirmed (100% verified)</div>
                <div className="audit-log-line amber">⚠ OEM Authorization requires manual officer review</div>
                <div className="audit-log-line blue">ℹ Cartel graph analysis: No circular bidding detected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: FOR BIDDERS */}
      <section id="bidders" className="portal-roles-section alt-bg">
        <div className="role-grid-card reverse-layout">
          <div className="role-visual-panel">
            <div className="mock-bidder-card">
              <div className="bidder-card-head">
                <FileText size={20} className="icon-orange" />
                <div>
                  <h4>Bidder Compliance Pre-Check</h4>
                  <span>Submission #GEM-2026-8942</span>
                </div>
              </div>
              <div className="bidder-checklist">
                <div className="check-item"><CheckCircle2 size={16} className="icon-emerald" /> GSTIN Status Active</div>
                <div className="check-item"><CheckCircle2 size={16} className="icon-emerald" /> MSME Certificate Verified</div>
                <div className="check-item"><CheckCircle2 size={16} className="icon-emerald" /> Non-Blacklisted Clearance</div>
              </div>
            </div>
          </div>
          <div className="role-content">
            <span className="role-eyebrow">FOR BIDDERS & SUPPLIERS</span>
            <h2>Pre-Audit Your Compliance Before Submission</h2>
            <p>
              Eliminate rejection due to missing statutory documentation. BidVerify helps suppliers verify compliance
              credentials in advance for frictionless GeM procurement.
            </p>
            <ul className="role-features-list">
              <li><CheckCircle2 size={16} className="icon-emerald" /> Instant pre-submission compliance audit</li>
              <li><CheckCircle2 size={16} className="icon-emerald" /> Automated MSME & exemption qualification checks</li>
              <li><CheckCircle2 size={16} className="icon-emerald" /> Document vault for recurring tender applications</li>
            </ul>
            <button className="btn-role-action orange-btn" onClick={() => onOpenRegister("register")}>
              Launch Bidder Portal <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: FAQS */}
      <section id="faqs" className="faqs-section">
        <div className="section-header-center">
          <span className="section-tag">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Got Questions? We Have Answers</h2>
          <p className="section-subtitle">
            Everything you need to know about BidVerify compliance automation.
          </p>
        </div>

        <div className="faqs-accordion">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
              <div className="faq-question" onClick={() => toggleFaq(idx)}>
                <h3>{faq.q}</h3>
                <ChevronDown className={`faq-chevron ${openFaq === idx ? "rotated" : ""}`} size={20} />
              </div>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-top-row">
          <div className="footer-col-brand">
            <img src="/logo.png" alt="BidVerify Logo" className="footer-logo-img" />
            <p className="footer-desc">
              AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement.
              Delivering speed, transparency, and accountability for government purchasing.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <a href="#home" onClick={() => scrollToSection("home")}>Home</a>
            <a href="#about" onClick={() => scrollToSection("about")}>About Platform</a>
            <a href="#how-it-works" onClick={() => scrollToSection("how-it-works")}>How It Works</a>
            <a href="#faqs" onClick={() => scrollToSection("faqs")}>FAQs</a>
          </div>

          <div className="footer-col">
            <h4>Portals</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenLogin("login"); }}>Officer Console</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenRegister("register"); }}>Bidder Workspace</a>
            <a href="https://gem.gov.in" target="_blank" rel="noopener noreferrer">GeM Official Portal <ExternalLink size={12} /></a>
          </div>

          <div className="footer-col">
            <h4>Compliance</h4>
            <span>GSTIN Verification</span>
            <span>Udyam MSME Checker</span>
            <span>Cartel & Fraud Detection</span>
            <span>Blockchain Audit Trail</span>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p>© 2026 BidVerify Platform. Developed for GeM Procurement Verification. All rights reserved.</p>
          <div className="footer-legal-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Statement</span>
          </div>
        </div>
      </footer>

      {/* WATCH DEMO MODAL */}
      {showDemoModal && (
        <div className="demo-modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="demo-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowDemoModal(false)}>
              <X size={20} />
            </button>
            <div className="demo-modal-header">
              <Sparkles size={20} className="icon-orange" />
              <h3>BidVerify Interactive Compliance Engine Demo</h3>
            </div>
            <div className="demo-modal-body">
              <div className="demo-video-placeholder">
                <Play size={48} className="demo-play-icon" />
                <p>Click below to launch interactive bidder compliance verification demo</p>
                <div className="demo-actions-row">
                  <button className="btn-hero-primary-orange" onClick={() => { setShowDemoModal(false); onOpenRegister("register"); }}>
                    Start Live Evaluation <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
