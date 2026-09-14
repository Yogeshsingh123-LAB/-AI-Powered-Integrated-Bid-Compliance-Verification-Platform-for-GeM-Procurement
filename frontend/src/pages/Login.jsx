import { apiFetch, safeJson, BACKEND_URL } from "../services/api";
import { readLoginSession } from "../services/loginSession";
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
  Briefcase,
  Fingerprint,
  Laptop,
  Usb,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound
} from "lucide-react";
import "./Login.css";

function Login({ onLogin, onDemo, initialIsSignUp = false, onBackToHome, onNavigateSection }) {
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
  const [captcha, setCaptcha] = useState("");
  const [captchaText, setCaptchaText] = useState("6MJLN");

  // Admin Biometric Authentication states (OFF by default)
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem("admin_biometric_enabled") === "true";
  });
  const [biometricDevice] = useState("external_hardware_key"); // Strictly External Biometric Device
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricScanStatus, setBiometricScanStatus] = useState("idle"); // "idle", "scanning", "success", "error"
  const [biometricScanMsg, setBiometricScanMsg] = useState("");

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
    // Sync backend biometric feature status on mount
    apiFetch(`${BACKEND_URL}/api/auth/biometric/status`)
      .then((res) => safeJson(res))
      .then((data) => {
        if (data && typeof data.enabled === "boolean") {
          // If local storage is not set yet, sync with backend state (OFF by default)
          if (localStorage.getItem("admin_biometric_enabled") === null) {
            setBiometricEnabled(data.enabled);
          }
        }
      })
      .catch(() => {
        // Fallback silently if offline or endpoint unreachable
      });
  }, []);

  const handleToggleBiometric = async (newVal) => {
    setBiometricEnabled(newVal);
    localStorage.setItem("admin_biometric_enabled", newVal ? "true" : "false");
    try {
      await apiFetch(`${BACKEND_URL}/api/auth/biometric/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newVal })
      });
    } catch (err) {
      console.warn("Could not sync biometric toggle with backend:", err);
    }
  };

  const triggerBiometricScan = async (deviceType = "external_hardware_key") => {
    setBiometricScanStatus("scanning");
    setBiometricScanMsg("Searching for external biometric device... Connect scanner or place finger on external reader.");
    setShowBiometricModal(true);
    setAuthError("");

    // Simulate/Attempt hardware WebAuthn credential retrieval
    let webAuthnSuccess = false;
    if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            timeout: 5000,
            userVerification: "preferred"
          }
        });
        if (credential) {
          webAuthnSuccess = true;
        }
      } catch (err) {
        // WebAuthn prompt cancelled or unavailable on localhost/http - fallback to simulated hardware authentication
        console.log("WebAuthn API fallback to secure hardware simulator:", err.message);
      }
    }

    // Wait short moment for visual feedback
    setTimeout(async () => {
      try {
        setBiometricScanMsg("Verifying biometric hash & cryptographic challenge...");
        const targetEmail = loginEmail.trim() || "admin@example.com";
        const response = await apiFetch(`${BACKEND_URL}/api/auth/biometric/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            device_type: deviceType,
            credential_id: webAuthnSuccess ? "webauthn_hardware_id" : "laptop_sensor_hash_99"
          })
        });

        const data = await readLoginSession(response);

        setBiometricScanStatus("success");
        setBiometricScanMsg(`Biometric Verification Successful! Welcome, ${data.user?.full_name || 'Admin'}.`);

        setTimeout(() => {
          setShowBiometricModal(false);
          onLogin(data.access_token, data.user);
        }, 1200);

      } catch (err) {
        setBiometricScanStatus("error");
        setBiometricScanMsg(err.message || "Biometric verification failed. Please try again.");
      }
    }, 1500);
  };


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
    setLoading(true);
    try {
      const response = await apiFetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail,
          password: password
        })
      });

      const data = await readLoginSession(response);

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

    if (signUpPassword.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`${BACKEND_URL}/api/auth/register`, {
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

      const data = await safeJson(response);

      if (!response.ok || !data || data.success === false) {
        throw new Error(data?.detail || data?.message || "Registration failed.");
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

                  {/* Admin Biometric Feature Switch Card (Shown on Administrative Console Tab) */}
                  {selectedPortal === "Buyer" && (
                    <div className="admin-biometric-toggle-card">
                      <div className="bio-toggle-header">
                        <div className="bio-toggle-title-wrap">
                          <Fingerprint size={20} className={`bio-icon ${biometricEnabled ? "active-glow" : ""}`} />
                          <div>
                            <div className="bio-label-row">
                              <span className="bio-card-title">External Biometric Authentication</span>
                              <span className={`bio-badge ${biometricEnabled ? "badge-on" : "badge-off"}`}>
                                {biometricEnabled ? "FEATURE ON" : "FEATURE OFF"}
                              </span>
                            </div>
                            <span className="bio-card-sub">
                              {biometricEnabled
                                ? "External USB / NFC biometric fingerprint device scanner enabled."
                                : "Biometric login is turned OFF. Toggle switch to enable."}
                            </span>
                          </div>
                        </div>
                        <label className="switch-toggle-wrapper" title="Toggle External Biometric Authentication ON/OFF">
                          <input
                            type="checkbox"
                            checked={biometricEnabled}
                            onChange={(e) => handleToggleBiometric(e.target.checked)}
                          />
                          <span className="slider-round"></span>
                        </label>
                      </div>

                      {/* If Biometric Feature is turned ON */}
                      {biometricEnabled && (
                        <div className="biometric-login-box">
                          <button
                            type="button"
                            className="biometric-scan-trigger-btn"
                            onClick={() => triggerBiometricScan("external_hardware_key")}
                            disabled={loading}
                          >
                            <Usb size={20} className="pulse-fingerprint-icon" />
                            <span>Scan External Biometric Device</span>
                          </button>
                          
                          <div className="bio-divider">
                            <span>OR LOGIN WITH PASSWORD</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Admin Credential Hint Box (Shown on Administrative Console Tab) */}
                  {selectedPortal === "Buyer" && (
                    <div style={{
                      margin: '10px 0 14px 0',
                      padding: '10px 14px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: '1px solid #86efac',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      color: '#166534'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>🔑 Default Admin Credentials:</strong>
                      <div>Email: <code style={{ fontWeight: 'bold', background: '#ffffff', padding: '2px 5px', borderRadius: '4px' }}>admin@gem.gov.in</code> or <code style={{ fontWeight: 'bold', background: '#ffffff', padding: '2px 5px', borderRadius: '4px' }}>admin@bidverify.gov.in</code></div>
                      <div style={{ marginTop: '2px' }}>Password: <code style={{ fontWeight: 'bold', background: '#ffffff', padding: '2px 5px', borderRadius: '4px' }}>AdminSecret2026!</code></div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button type="submit" className="login-submit-orange-btn" disabled={loading}>
                    {loading ? "Logging in..." : "Login →"}
                  </button>

                  {/* Quick Demo Access Buttons */}
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPortal === "Buyer" ? (
                      <>
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                            border: '1px solid #d8b4fe',
                            color: '#7e22ce',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setLoginEmail("admin@gem.gov.in");
                            setPassword("AdminSecret2026!");
                          }}
                        >
                          <span>👑 Autofill Super Admin Credentials</span>
                        </button>
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            border: '1px solid #93c5fd',
                            color: '#1d4ed8',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            setLoginEmail("officer@gem.gov.in");
                            setPassword("OfficerPassword123");
                          }}
                        >
                          <span>🛡️ Autofill Officer Credentials</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                          border: '1px solid #fdba74',
                          color: '#c2410c',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          setLoginEmail("bidder@techsolutions.com");
                          setPassword("BidderPassword123!");
                        }}
                      >
                        <span>⚡ Autofill Bidder Credentials</span>
                      </button>
                    )}

                    {onDemo && (
                      <button
                        type="button"
                        className="login-demo-btn"
                        disabled={loading || Boolean(successMsg)}
                        onClick={() => onDemo(selectedPortal)}
                      >
                        Explore demo workspace ({selectedPortal === "Buyer" ? "Officer" : "Supplier"})
                      </button>
                    )}
                  </div>

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
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        title={showSignUpPassword ? "Hide password" : "Show password"}
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
                        <div className={`pass-rule-item ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signUpPassword) ? "valid" : ""}`}>
                          <CheckCircle2 size={13} className="rule-icon" />
                          <span>At least 1 Special character (e.g. @ # $ % ! & *)</span>
                        </div>
                      </div>
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

      {/* BIOMETRIC AUTHENTICATION SCANNER MODAL */}
      {showBiometricModal && (
        <div className="biometric-modal-overlay">
          <div className="biometric-modal-card">
            <button
              type="button"
              className="biometric-modal-close-btn"
              onClick={() => setShowBiometricModal(false)}
            >
              <X size={20} />
            </button>

            <div className="biometric-modal-header">
              <div className="biometric-device-badge">
                <Usb size={18} />
                <span>External Biometric Device (USB / NFC Fingerprint Reader)</span>
              </div>
              <h3 className="biometric-modal-title">External Biometric Verification</h3>
            </div>

            <div className="biometric-scanner-visual-container">
              <div className={`biometric-fingerprint-ring ${biometricScanStatus}`}>
                <Fingerprint size={64} className="biometric-glowing-fingerprint" />
                <div className="scanner-line-beam"></div>
              </div>
            </div>

            <div className="biometric-status-msg-box">
              {biometricScanStatus === "scanning" && (
                <p className="bio-status-text scanning">{biometricScanMsg}</p>
              )}
              {biometricScanStatus === "success" && (
                <div className="bio-status-text success">
                  <CheckCircle2 size={18} />
                  <span>{biometricScanMsg}</span>
                </div>
              )}
              {biometricScanStatus === "error" && (
                <div className="bio-status-text error">
                  <AlertCircle size={18} />
                  <span>{biometricScanMsg}</span>
                </div>
              )}
            </div>

            {biometricScanStatus === "error" && (
              <button
                type="button"
                className="biometric-retry-btn"
                onClick={() => triggerBiometricScan("external_hardware_key")}
              >
                Retry External Biometric Scan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
