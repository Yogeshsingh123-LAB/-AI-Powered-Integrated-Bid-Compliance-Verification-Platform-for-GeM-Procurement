import React, { useState, useEffect } from "react";
import { Shield, User, CloudUpload, ArrowLeft, Lock, Mail, Terminal, Database, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";

function Login({ onLogin }) {
  // Portal choice: null, 'Supplier' (Bidder Terminal), 'Buyer' (Audit Console)
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [securityWarning, setSecurityWarning] = useState("");
  
  // Auth loading/error states
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState("G7K4P");

  // Sign Up states
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [organization, setOrganization] = useState("");

  // Dev helper panel state
  const [isDevCollapsed, setIsDevCollapsed] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    generateCaptcha();
  }, [selectedPortal]);

  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";
    for (let i = 0; i < 5; i++) {
      newCaptcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(newCaptcha);
    setCaptcha("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSecurityWarning("");
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
      const response = await fetch(`${API_BASE}/api/auth/login`, {
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
          setSecurityWarning("Access Denied: Supplier accounts do not have clearance level permissions for the Audit Console Terminal.");
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setSuccessMsg("");

    if (!signUpName || !signUpEmail || !signUpPassword || !organization) {
      setAuthError("Please fill out all required fields to register.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
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

      setSuccessMsg("Registration successful! Directing to Supplier login.");
      setTimeout(() => {
        setLoginEmail(signUpEmail);
        setIsSignUp(false); // Switch to sign in view
        setSuccessMsg("");
        generateCaptcha();
      }, 1500);

    } catch (err) {
      setAuthError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const triggerMockCredentials = (email, pwd, portalType) => {
    setSelectedPortal(portalType);
    setLoginEmail(email);
    setPassword(pwd);
    // Autofill Captcha to make testing fast & friendly
    setCaptcha(captchaText);
    setAuthError("");
    setSecurityWarning("");
    setSuccessMsg("");
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/seed`, {
        method: "POST"
      });
      if (response.ok) {
        alert("Developer Database Seeded successfully! Mock accounts are now active.");
      } else {
        alert("Database seeding failed or mock data already exists.");
      }
    } catch (err) {
      alert("Error connecting to backend for database seeding: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // 3D Parallax Tilt Logic
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rx = -(y / (box.height / 2)) * 6; // max 6 deg
    const ry = (x / (box.width / 2)) * 6; // max 6 deg
    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  // RENDER SELECTOR GATEWAY
  if (selectedPortal === null) {
    return (
      <div className="login-3d-page-wrapper">
        <div className="gateway-wrapper">
          <div className="gateway-title-wrapper">
            <h1>GeM Sovereign Procurement Gateway</h1>
            <p>Select your authorized entry point below to access the bid compliance platform</p>
          </div>

          <div className="gateway-cards">
            {/* Supplier / Bidder Card */}
            <div className="gateway-card supplier" onClick={() => setSelectedPortal("Supplier")}>
              <div className="gateway-icon-container">
                <CloudUpload size={32} />
              </div>
              <h2>Bidder / Supplier Terminal</h2>
              <p>
                For commercial enterprises and organizations submitting bids.
                Upload files, execute AI integrity scans, and monitor compliance scores.
              </p>
              <button className="gateway-btn">Access Terminal</button>
            </div>

            {/* Officer / Admin Card */}
            <div className="gateway-card auditor" onClick={() => setSelectedPortal("Buyer")}>
              <div className="gateway-icon-container">
                <Shield size={32} />
              </div>
              <h2>Administrative Audit Console</h2>
              <p>
                Restricted to procurement officers, government auditors, and system administrators.
                Perform cross-registry audits, sign-off on bids, and configure system rules.
              </p>
              <button className="gateway-btn">Open Console</button>
            </div>
          </div>
        </div>

        {/* Developer Helper Panel */}
        <DevCredentialsPanel 
          isCollapsed={isDevCollapsed} 
          onToggle={() => setIsDevCollapsed(!isDevCollapsed)} 
          onSelectAcc={triggerMockCredentials}
          onSeed={handleSeedDatabase}
          seeding={seeding}
        />
      </div>
    );
  }

  // RENDER SEPARATE LOGIN INTERFACES
  return (
    <div className="login-3d-page-wrapper">
      <div 
        className={`login-container ${isSignUp ? "right-panel-active" : ""} ${selectedPortal === "Buyer" ? "auditor-theme" : "supplier-theme"}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* SUPPLIER SIGN UP PANEL (only rendered if selectedPortal is Supplier) */}
        {selectedPortal === "Supplier" && (
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignUp}>
              <h2>Supplier Registration</h2>
              
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={signUpName} 
                  onChange={(e) => setSignUpName(e.target.value)} 
                  required 
                />
                <span className="input-icon-right">👤</span>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={signUpEmail} 
                  onChange={(e) => setSignUpEmail(e.target.value)} 
                  required 
                />
                <span className="input-icon-right">✉</span>
              </div>

              <div className="input-group">
                <label>Secure Password</label>
                <input 
                  type="password" 
                  value={signUpPassword} 
                  onChange={(e) => setSignUpPassword(e.target.value)} 
                  required 
                />
                <span className="input-icon-right">🔒</span>
              </div>

              <div className="input-group">
                <label>Organization Name</label>
                <input 
                  type="text" 
                  value={organization} 
                  onChange={(e) => setOrganization(e.target.value)} 
                  required 
                />
                <span className="input-icon-right">🏢</span>
              </div>

              {authError && <div className="security-warning-banner" style={{ marginTop: '5px', marginBottom: '5px' }}><div className="warning-text">{authError}</div></div>}
              {successMsg && <div className="milestone-badge ocr" style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center', display: 'block', width: '100%' }}>{successMsg}</div>}

              <button type="submit" className="neon-button" disabled={loading}>
                {loading ? "Registering..." : "Register Account"}
              </button>
              
              <span className="toggle-text">
                Already registered?{" "}
                <span className="toggle-link" onClick={() => setIsSignUp(false)}>
                  Sign In
                </span>
              </span>
            </form>
          </div>
        )}

        {/* SIGN IN PANEL */}
        <div className="form-container sign-in-container" style={{ width: selectedPortal === "Buyer" ? "100%" : "50%" }}>
          <form onSubmit={handleLogin}>
            <span className="back-to-gateway" onClick={() => {
              setSelectedPortal(null);
              setIsSignUp(false);
              setAuthError("");
              setSecurityWarning("");
              setSuccessMsg("");
            }}>
              <ArrowLeft size={14} /> Back to Gateway
            </span>
            
            <h2>{selectedPortal === "Buyer" ? "Administrative Sign In" : "Bidder Terminal Sign In"}</h2>

            {/* Error banners */}
            {securityWarning && (
              <div className="security-warning-banner">
                <Shield size={20} style={{ flexShrink: 0 }} />
                <div className="warning-text">{securityWarning}</div>
              </div>
            )}

            {authError && (
              <div className="security-warning-banner" style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5' }}>
                <div className="warning-text">{authError}</div>
              </div>
            )}

            {successMsg && (
              <div className="milestone-badge ocr" style={{ padding: '8px', fontSize: '0.8rem', textAlign: 'center', display: 'block', width: '100%' }}>
                {successMsg}
              </div>
            )}
            
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                required 
                placeholder="Enter email"
              />
              <span className="input-icon-right">✉</span>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🔓" : "🔒"}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="captcha-section">
              <div className="captcha-header">
                <span className="captcha-label">Security Verification Code</span>
                <div className="captcha-box-wrapper">
                  <div 
                    className="captcha-box"
                    onCopy={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    {captchaText}
                  </div>
                  <button 
                    type="button" 
                    className="refresh-captcha"
                    onClick={generateCaptcha}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Enter Captcha *" 
                  value={captcha} 
                  onChange={(e) => setCaptcha(e.target.value)} 
                  required 
                />
                <span className="input-icon-right">🛡️</span>
              </div>
            </div>

            <button type="submit" className="neon-button" style={{ 
              backgroundColor: selectedPortal === "Buyer" ? "#ef4444" : "#10b981",
              boxShadow: selectedPortal === "Buyer" ? "0 0 15px rgba(239, 68, 68, 0.4)" : "0 0 15px rgba(16, 185, 129, 0.4)"
            }} disabled={loading}>
              {loading ? "Authenticating..." : "Authenticate Securely"}
            </button>
            
            {selectedPortal === "Supplier" && (
              <span className="toggle-text">
                New Supplier?{" "}
                <span className="toggle-link" onClick={() => setIsSignUp(true)}>
                  Register Portal Account
                </span>
              </span>
            )}
          </form>
        </div>

        {/* OVERLAY PANEL (only displayed on Supplier Portal for transition) */}
        {selectedPortal === "Supplier" && (
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h2>Secure Portal</h2>
                <p style={{ fontSize: '0.85rem', color: '#a5b4fc', marginTop: '8px' }}>
                  Register to upload bids and certificates. Integrated AI-Powered compliance verification platform.
                </p>
              </div>
              
              <div className="overlay-panel overlay-right">
                <h2>Sovereign GeM</h2>
                <p style={{ fontSize: '0.85rem', color: '#a5b4fc', marginTop: '8px' }}>
                  Upload regulatory compliance files. Running automated verification pipeline with speed, safety, and precision.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Developer Helper Panel */}
      <DevCredentialsPanel 
        isCollapsed={isDevCollapsed} 
        onToggle={() => setIsDevCollapsed(!isDevCollapsed)} 
        onSelectAcc={triggerMockCredentials}
        onSeed={handleSeedDatabase}
        seeding={seeding}
      />
    </div>
  );
}

// Separate Presentational Component for Dev Helpers
function DevCredentialsPanel({ isCollapsed, onToggle, onSelectAcc, onSeed, seeding }) {
  return (
    <div className={`dev-helper-drawer ${isCollapsed ? "collapsed" : ""}`}>
      <div className="dev-helper-header" onClick={onToggle}>
        <span>
          <Terminal size={14} /> DEVELOPMENT CREDENTIALS & AUTOFILL ASSISTANT
        </span>
        <button type="button">
          {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div className="dev-helper-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'left', margin: 0 }}>
            Click on any profile card below to autofill and switch to the correct portal configuration instantly.
          </p>
          <button 
            type="button" 
            className="dev-helper-seed-button"
            onClick={onSeed}
            disabled={seeding}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Database size={12} /> {seeding ? "Seeding..." : "Seed Mock Database Accounts"}
          </button>
        </div>
        
        <div className="dev-helper-grid">
          {/* Supplier Bidder */}
          <div className="dev-account-card" onClick={() => onSelectAcc("bidder@example.com", "BidderPassword123", "Supplier")}>
            <span className="dev-account-role bidder">SUPPLIER (BIDDER)</span>
            <div className="dev-account-email">bidder@example.com</div>
            <div className="dev-account-pwd">Pwd: BidderPassword123</div>
          </div>

          {/* Officer */}
          <div className="dev-account-card" onClick={() => onSelectAcc("officer@example.com", "OfficerPassword123", "Buyer")}>
            <span className="dev-account-role officer">OFFICER (AUDITOR)</span>
            <div className="dev-account-email">officer@example.com</div>
            <div className="dev-account-pwd">Pwd: OfficerPassword123</div>
          </div>

          {/* Admin */}
          <div className="dev-account-card" onClick={() => onSelectAcc("admin@example.com", "AdminPassword123", "Buyer")}>
            <span className="dev-account-role admin">SUPER ADMIN</span>
            <div className="dev-account-email">admin@example.com</div>
            <div className="dev-account-pwd">Pwd: AdminPassword123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;