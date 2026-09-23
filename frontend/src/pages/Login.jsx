import { apiFetch, safeJson, BACKEND_URL } from "../services/api";
import { readLoginSession } from "../services/loginSession";
import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Building,
  FileText,
  TrendingUp,
  Shield,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Info
} from "lucide-react";
import "./Login.css";

function Login({ onLogin, onDemo, initialIsSignUp = false, onBackToHome, onNavigateSection, onNavigateLegal }) {
  const [selectedPortal, setSelectedPortal] = useState("Supplier"); // Supplier (Bidder) or Buyer (Officer/Admin)
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");

  // Biometric hardware-key login: reported as disabled by the backend until a
  // secure server-side WebAuthn implementation ships (the previous public
  // toggle/verify endpoints were removed after audit).
  const [biometricStatus, setBiometricStatus] = useState({ enabled: false, message: "Biometric login is not available in this release." });

  // Sign Up states
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [organization, setOrganization] = useState("");

  const handleNavClick = (sectionId) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else if (onBackToHome) {
      onBackToHome();
    }
  };

  const API_BASE = BACKEND_URL;

  useEffect(() => {
    apiFetch("/api/auth/biometric/status")
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && typeof data.enabled === "boolean") {
          setBiometricStatus({ enabled: data.enabled, message: data.message || "" });
        }
      })
      .catch(() => {
        /* offline: keep the default disabled state */
      });
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    if (!loginEmail || !password) {
      setAuthError("Please enter Email Address and Password.");
      return;
    }

    setLoading(true);
    try {
      const cleanLoginEmail = (loginEmail || "").trim().toLowerCase();
      let response;
      try {
        response = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanLoginEmail,
            password: password
          })
        });
      } catch (networkErr) {
        // SECURITY: there is no client-side fallback authentication. If the
        // authentication service is unreachable, the user is told so — a
        // session is NEVER created locally.
        throw new Error("The authentication service is currently unreachable. Please check your connection and try again.");
      }

      const data = await readLoginSession(response);
      const user = data.user;
      const token = data.access_token;

      // Seamless auto-detection and portal routing based on user's authorized role
      const userRole = (user?.role || "").toUpperCase();
      if (userRole.includes("OFFICER") || userRole.includes("AUDITOR") || userRole.includes("ADMIN")) {
        setSelectedPortal("Buyer");
      } else {
        setSelectedPortal("Supplier");
      }

      setSuccessMsg(`Welcome, ${user.full_name || 'User'}! Redirecting...`);
      setTimeout(() => {
        onLogin(token, user);
      }, 800);

    } catch (err) {
      setAuthError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    if (!signUpName || !signUpEmail || !signUpPassword || !organization) {
      setAuthError("Please fill out all required fields to register.");
      return;
    }

    if (signUpPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    const cleanSignUpEmail = (signUpEmail || "").trim().toLowerCase();
    setLoading(true);
    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: `${signUpName.trim()} (${organization.trim()})`,
          email: cleanSignUpEmail,
          password: signUpPassword,
          role: "BIDDER"
        })
      });

      const data = await safeJson(response);

      if (!response.ok || !data || data.success === false) {
        throw new Error(data?.detail || data?.message || "Registration failed.");
      }

      setSuccessMsg("Registration successful! Directing to login.");
      setTimeout(() => {
        setLoginEmail(cleanSignUpEmail);
        setSelectedPortal("Supplier");
        setIsSignUp(false);
        setSuccessMsg("");
      }, 1500);

    } catch (err) {
      setAuthError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const legalLink = (page) => onNavigateLegal ? () => onNavigateLegal(page) : () => {};

  return (
    <div className="login-redesign-page-wrapper">
      {/* NAVBAR */}
      <header className="login-page-navbar">
        <div className="login-nav-wrapper">
          <button type="button" className="login-brand-logo" onClick={onBackToHome} aria-label="Back to home">
            <img src="/logo.png" alt="Bid Zee Logo" className="login-brand-img" />
          </button>

          <nav className="login-nav-links">
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("home")}>Home</button>
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("about")}>About</button>
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("how-it-works")}>How It Works</button>
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("officers")}>For Procurement Officers</button>
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("bidders")}>For Bidders</button>
            <button type="button" className="login-nav-item" onClick={() => handleNavClick("faqs")}>FAQs</button>
          </nav>

          {onBackToHome && (
            <button type="button" className="login-back-home-btn" onClick={onBackToHome}>
              ← Back to Home
            </button>
          )}
        </div>
      </header>

      {/* HERO / MAIN BODY */}
      <main className="login-hero-container">
        {/* Background Image Overlay */}
        <div className="login-bg-overlay" aria-hidden="true">
          <img src="/hero_government_building.jpg" alt="" className="login-bg-img" />
          <div className="login-bg-scrim"></div>
        </div>

        <div className="login-hero-content-grid">
          {/* LEFT CONTENT COLUMN */}
          <div className="login-left-hero-col">
            <div className="login-eyebrow-pill">
              <span className="pill-pulse-dot"></span>
              <span className="pill-label">AI-POWERED BID COMPLIANCE PLATFORM</span>
            </div>

            <h1 className="login-hero-headline">
              Secure Access<br />
              for a Transparent<br />
              <span className="highlight-orange">Procurement Ecosystem.</span>
            </h1>

            <p className="login-hero-description">
              Login to Bid Zee and streamline bidder compliance verification with AI —
              making public procurement faster, fairer and more transparent.
            </p>

            {/* 3 Feature Boxes */}
            <div className="login-features-boxes-row">
              <div className="login-feature-card">
                <div className="feature-card-icon-wrap"><Shield size={20} /></div>
                <div className="feature-card-text">
                  <strong>Secure &</strong>
                  <span>Role-Based Access</span>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="feature-card-icon-wrap"><FileText size={20} /></div>
                <div className="feature-card-text">
                  <strong>Government</strong>
                  <span>Portal Integration</span>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="feature-card-icon-wrap"><TrendingUp size={20} /></div>
                <div className="feature-card-text">
                  <strong>Accurate Insights</strong>
                  <span>& Decisions</span>
                </div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="login-quote-container">
              <span className="quote-mark">“</span>
              <div className="quote-content">
                <p className="quote-text">
                  “Technology for a more transparent and efficient Bharat.”
                </p>
                <div className="quote-tricolor-line">
                  <span className="saffron"></span>
                  <span className="white"></span>
                  <span className="green"></span>
                </div>
                <div className="quote-sponsors">
                  <span>Government e-Marketplace</span>
                  <span className="dot">|</span>
                  <span>Digital India</span>
                  <span className="dot">|</span>
                  <span>Aatmanirbhar Bharat</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - WHITE LOGIN CARD */}
          <div className="login-right-card-col">
            <div className="login-form-white-card">
              {!isSignUp ? (
                /* SIGN IN FORM */
                <form onSubmit={handleLoginSubmit} className="login-form-inner">
                  <h2 className="card-welcome-title">
                    Welcome to <span className="highlight-orange">Bid Zee</span>
                  </h2>
                  <p className="card-welcome-subtitle">Login to access the platform</p>

                  {/* Portal Selection Tabs */}
                  <div className="portal-selector-tabs">
                    <button
                      type="button"
                      className={`portal-select-btn ${selectedPortal === "Supplier" ? "active" : ""}`}
                      onClick={() => { setSelectedPortal("Supplier"); setAuthError(""); setSuccessMsg(""); }}
                    >
                      <User size={16} />
                      <span>Bidder Portal</span>
                    </button>
                    <button
                      type="button"
                      className={`portal-select-btn ${selectedPortal === "Buyer" ? "active" : ""}`}
                      onClick={() => { setSelectedPortal("Buyer"); setAuthError(""); setSuccessMsg(""); }}
                    >
                      <Building size={16} />
                      <span>Administrative Console</span>
                    </button>
                  </div>

                  {/* Biometric status notice (feature disabled in this release) */}
                  {selectedPortal === "Buyer" && (
                    <div className="admin-biometric-toggle-card" role="note">
                      <div className="bio-toggle-header">
                        <div className="bio-toggle-title-wrap">
                          <Fingerprint size={20} className="bio-icon" />
                          <div>
                            <div className="bio-label-row">
                              <span className="bio-card-title">External Biometric Authentication</span>
                              <span className="bio-badge badge-off">FEATURE OFF</span>
                            </div>
                            <span className="bio-card-sub">
                              {biometricStatus.message || "Biometric login is not available in this release. Please use email and password."}
                            </span>
                          </div>
                        </div>
                        <Info size={18} aria-hidden="true" />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="form-input-group">
                    <label htmlFor="login-email">Email Address</label>
                    <div className="input-field-wrapper">
                      <Mail size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-input-group">
                    <label htmlFor="login-password">Password</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="forgot-pass-wrapper">
                      <a
                        href="mailto:support@bidzee.example"
                        className="forgot-link"
                      >
                        Forgot Password?
                      </a>
                    </div>
                  </div>

                  <div aria-live="assertive">
                    {authError && <div className="login-error-alert" role="alert">{authError}</div>}
                    {successMsg && <div className="login-success-alert" role="status">{successMsg}</div>}
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="login-submit-orange-btn" disabled={loading}>
                    {loading ? "Logging in..." : "Login →"}
                  </button>

                  {/* Switch to Register */}
                  <div className="switch-auth-mode-prompt">
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      className="switch-auth-link"
                      onClick={() => { setIsSignUp(true); setAuthError(""); setSuccessMsg(""); }}
                    >
                      Sign Up
                    </button>
                  </div>
                </form>
              ) : (
                /* SIGN UP FORM */
                <form onSubmit={handleSignUpSubmit} className="login-form-inner">
                  <h2 className="card-welcome-title">
                    Create Account on <span className="highlight-orange">Bid Zee</span>
                  </h2>
                  <p className="card-welcome-subtitle">Register to join the compliance platform</p>

                  {/* Name Input */}
                  <div className="form-input-group">
                    <label htmlFor="signup-name">Full Name</label>
                    <div className="input-field-wrapper">
                      <User size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="signup-name"
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="form-input-group">
                    <label htmlFor="signup-email">Email Address</label>
                    <div className="input-field-wrapper">
                      <Mail size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="signup-email"
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-input-group">
                    <label htmlFor="signup-password">Password</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        title={showSignUpPassword ? "Hide password" : "Show password"}
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                      >
                        {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Creation Character Description & Requirements */}
                    <div className="password-rules-box">
                      <div className="password-rules-header">
                        <Shield size={14} className="password-rules-icon" />
                        <span>Password Creation Requirements & Character Guidelines</span>
                      </div>
                      <p className="password-rules-desc">
                        Create a secure password using a combination of the following character types:
                      </p>
                      <div className="password-rules-grid">
                        <div className={`pass-rule-item ${signUpPassword.length >= 8 ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 8 characters long</span>
                        </div>
                        <div className={`pass-rule-item ${/[A-Z]/.test(signUpPassword) ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 1 Uppercase letter (A–Z)</span>
                        </div>
                        <div className={`pass-rule-item ${/[a-z]/.test(signUpPassword) ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 1 Lowercase letter (a–z)</span>
                        </div>
                        <div className={`pass-rule-item ${/[0-9]/.test(signUpPassword) ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 1 Numeric digit (0–9)</span>
                        </div>
                        <div className={`pass-rule-item ${/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(signUpPassword) ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 1 Special character (e.g. @ # $ % ! & *)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organization Input */}
                  <div className="form-input-group">
                    <label htmlFor="signup-org">Organization / Company Name</label>
                    <div className="input-field-wrapper">
                      <Building size={18} className="field-icon-left" aria-hidden="true" />
                      <input
                        id="signup-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Enter company or department"
                        autoComplete="organization"
                        required
                      />
                    </div>
                  </div>

                  <div aria-live="assertive">
                    {authError && <div className="login-error-alert" role="alert">{authError}</div>}
                    {successMsg && <div className="login-success-alert" role="status">{successMsg}</div>}
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="login-submit-orange-btn" disabled={loading}>
                    {loading ? "Registering..." : "Register →"}
                  </button>

                  {/* Switch to Login */}
                  <div className="switch-auth-mode-prompt">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="switch-auth-link"
                      onClick={() => { setIsSignUp(false); setAuthError(""); setSuccessMsg(""); }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="login-page-footer-bar">
        <div className="login-footer-content-wrapper">
          <div className="government-partner-emblems">
            <div className="emblem-item">
              <span className="emblem-icon">🏛️</span>
              <div className="emblem-text">
                <strong>Ministry of Petroleum &amp; Natural Gas</strong>
                <span>Government of India</span>
              </div>
            </div>

            <div className="emblem-divider"></div>

            <div className="emblem-item">
              <span className="emblem-icon">🏢</span>
              <div className="emblem-text">
                <strong>Chennai Petroleum Corporation Limited</strong>
                <span>(CPCL)</span>
              </div>
            </div>

            <div className="emblem-divider"></div>

            <div className="emblem-item">
              <img src="/logo.png" alt="GeM Logo" className="gem-footer-logo" />
              <div className="emblem-text">
                <strong>GeM Government eMarketplace</strong>
              </div>
            </div>
          </div>

          <div className="login-footer-legal-links">
            <button type="button" onClick={legalLink("privacy")}>Privacy</button>
            <button type="button" onClick={legalLink("terms")}>Terms</button>
            <button type="button" onClick={legalLink("contact")}>Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
