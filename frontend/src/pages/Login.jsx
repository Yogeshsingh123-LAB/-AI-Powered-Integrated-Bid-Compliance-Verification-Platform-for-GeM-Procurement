import { apiFetch, BACKEND_URL } from "../services/api";
import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Building,
  FileText,
  TrendingUp,
  Shield,
  Briefcase
} from "lucide-react";
import "./Login.css";

function Login({ onLogin, initialIsSignUp = false, onBackToHome, onNavigateSection }) {
  const [selectedPortal, setSelectedPortal] = useState("Supplier"); // Supplier (Bidder) or Buyer (Officer/Admin)
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaText, setCaptchaText] = useState("6MJLN");

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
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";
    for (let i = 0; i < 5; i++) {
      newCaptcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(newCaptcha);
    setCaptcha("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    if (!loginEmail || !password) {
      setAuthError("Please enter Email Address and Password.");
      return;
    }
    if (!captcha) {
      setAuthError("Please enter the security verification CAPTCHA.");
      return;
    }
    if (captcha.toUpperCase() !== captchaText) {
      setAuthError("Verification failed. The CAPTCHA code is incorrect.");
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail,
          password: password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed. Check your credentials.");
      }

      const data = await response.json();
      const token = data.access_token;
      const user = data.user;

      // Access control rule: User do not have admin power
      if (selectedPortal === "Buyer") {
        if (user.role.toUpperCase() !== "OFFICER" && user.role.toUpperCase() !== "ADMIN") {
          setAuthError("Access Denied: Supplier accounts do not have clearance level permissions for the Audit Console Terminal.");
          setLoading(false);
          generateCaptcha();
          return;
        }
      }

      // Access control rule: Admin/Officer portal tab clearance
      if (selectedPortal === "Supplier") {
        if (user.role.toUpperCase() !== "BIDDER" && user.role.toUpperCase() !== "ADMIN") {
          setAuthError("Access Denied: Administrative accounts should log in through the Audit Console Portal.");
          setLoading(false);
          generateCaptcha();
          return;
        }
      }

      setSuccessMsg(`Welcome, ${user.full_name || 'User'}! Redirecting...`);
      setTimeout(() => {
        onLogin(token, user);
      }, 1000);

    } catch (err) {
      setAuthError(err.message || "Connection refused by authentication server.");
      generateCaptcha();
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

    setLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: `${signUpName} (${organization})`,
          email: signUpEmail,
          password: signUpPassword,
          role: "BIDDER"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed.");
      }

      setSuccessMsg("Registration successful! Directing to login.");
      setTimeout(() => {
        setLoginEmail(signUpEmail);
        setIsSignUp(false);
        setSuccessMsg("");
        generateCaptcha();
      }, 1500);

    } catch (err) {
      setAuthError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-redesign-page-wrapper">
      {/* NAVBAR */}
      <header className="login-page-navbar">
        <div className="login-nav-wrapper">
          <div className="login-brand-logo" onClick={onBackToHome}>
            <img src="/logo.png" alt="BidVerify Logo" className="login-brand-img" />
          </div>

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
        <div className="login-bg-overlay">
          <img src="/hero_government_building.jpg" alt="Parliament backdrop" className="login-bg-img" />
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
              Login to BidVerify and streamline bidder compliance verification with AI —
              making public procurement faster, fairer and more transparent.
            </p>

            {/* 3 Feature Boxes */}
            <div className="login-features-boxes-row">
              <div className="login-feature-card">
                <div className="feature-card-icon-wrap">
                  <Shield size={20} />
                </div>
                <div className="feature-card-text">
                  <strong>Secure &</strong>
                  <span>Role-Based Access</span>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="feature-card-icon-wrap">
                  <FileText size={20} />
                </div>
                <div className="feature-card-text">
                  <strong>Government</strong>
                  <span>Portal Integration</span>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="feature-card-icon-wrap">
                  <TrendingUp size={20} />
                </div>
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
                    Welcome to <span className="highlight-orange">BidVerify</span>
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

                  {/* Email Input */}
                  <div className="form-input-group">
                    <label>Email Address</label>
                    <div className="input-field-wrapper">
                      <Mail size={18} className="field-icon-left" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-input-group">
                    <label>Password</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon-left" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="forgot-pass-wrapper">
                      <span className="forgot-link" onClick={() => setAuthError("Reset instructions sent to your email.")}>
                        Forgot Password?
                      </span>
                    </div>
                  </div>

                  {/* Security Code (CAPTCHA) */}
                  <div className="form-input-group">
                    <label>Security Code</label>
                    <div className="captcha-control-row">
                      <div className="input-field-wrapper captcha-input-field">
                        <ShieldCheck size={18} className="field-icon-left" />
                        <input
                          type="text"
                          value={captcha}
                          onChange={(e) => setCaptcha(e.target.value)}
                          placeholder="Enter captcha code"
                          required
                        />
                      </div>
                      <div className="captcha-code-display">
                        {captchaText.split("").join(" ")}
                      </div>
                      <button
                        type="button"
                        className="captcha-refresh-btn"
                        onClick={generateCaptcha}
                        title="Refresh Security Code"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  {authError && <div className="login-error-alert">{authError}</div>}
                  {successMsg && <div className="login-success-alert">{successMsg}</div>}

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
                    Create Account on <span className="highlight-orange">BidVerify</span>
                  </h2>
                  <p className="card-welcome-subtitle">Register to join the compliance platform</p>

                  {/* Name Input */}
                  <div className="form-input-group">
                    <label>Full Name</label>
                    <div className="input-field-wrapper">
                      <User size={18} className="field-icon-left" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="form-input-group">
                    <label>Email Address</label>
                    <div className="input-field-wrapper">
                      <Mail size={18} className="field-icon-left" />
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="form-input-group">
                    <label>Password</label>
                    <div className="input-field-wrapper">
                      <Lock size={18} className="field-icon-left" />
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                      />
                    </div>
                  </div>

                  {/* Organization Input */}
                  <div className="form-input-group">
                    <label>Organization / Company Name</label>
                    <div className="input-field-wrapper">
                      <Building size={18} className="field-icon-left" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Enter company or department"
                        required
                      />
                    </div>
                  </div>

                  {authError && <div className="login-error-alert">{authError}</div>}
                  {successMsg && <div className="login-success-alert">{successMsg}</div>}

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
                <strong>Ministry of Petroleum & Natural Gas</strong>
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
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;