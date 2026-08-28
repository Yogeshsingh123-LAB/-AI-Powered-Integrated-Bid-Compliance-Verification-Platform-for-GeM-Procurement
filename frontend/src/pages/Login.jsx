import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Terminal, Database, ChevronUp, ChevronDown, RefreshCw, ShieldCheck } from "lucide-react";

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
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

  const handleLogin = async (e) => {
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

      setSuccessMsg("Registration successful! Directing to login.");
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
    setLoginEmail(email);
    setPassword(pwd);
    setCaptcha(captchaText);
    setAuthError("");
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

  return (
    <div className="login-3d-page-wrapper">
      <div className={`login-card-container ${isSignUp ? "right-panel-active" : ""}`}>

        {/* SIGN IN CONTAINER */}
        <div className="form-side sign-in-side">
          <form onSubmit={handleLogin}>
            <h2>Login</h2>

            <div className="underline-input-group">
              <label>Username</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                />
                <User size={18} className="input-icon" />
              </div>
            </div>

            <div className="underline-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
                <Lock size={18} className="input-icon" />
              </div>
            </div>

            {/* Captcha */}
            <div className="captcha-row">
              <div className="underline-input-group captcha-input-box">
                <label>Security Code</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    placeholder="Enter Captcha *"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    required
                  />
                  <ShieldCheck size={18} className="input-icon" />
                </div>
              </div>
              <div className="captcha-code-container">
                <div className="captcha-display">{captchaText}</div>
                <button type="button" className="refresh-btn" onClick={generateCaptcha}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {authError && <div className="error-message">{authError}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <button type="submit" className="capsule-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <span className="switch-prompt">
              Don't have an account?{" "}
              <span className="switch-link" onClick={() => { setIsSignUp(true); setAuthError(""); setSuccessMsg(""); }}>
                Sign Up
              </span>
            </span>
          </form>
        </div>

        {/* SIGN UP CONTAINER */}
        <div className="form-side sign-up-side">
          <form onSubmit={handleSignUp}>
            <h2>Register</h2>

            <div className="underline-input-group">
              <label>Username</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  placeholder="Enter username"
                />
                <User size={18} className="input-icon" />
              </div>
            </div>

            <div className="underline-input-group">
              <label>Email</label>
              <div className="input-with-icon">
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>

            <div className="underline-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
                <Lock size={18} className="input-icon" />
              </div>
            </div>

            <div className="underline-input-group">
              <label>Organization</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  placeholder="Enter organization"
                />
                <span className="input-icon" style={{ fontSize: "14px", fontWeight: "bold" }}>🏢</span>
              </div>
            </div>

            {authError && <div className="error-message">{authError}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <button type="submit" className="capsule-btn" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>

            <span className="switch-prompt">
              Already have an account?{" "}
              <span className="switch-link" onClick={() => { setIsSignUp(false); setAuthError(""); setSuccessMsg(""); }}>
                Sign In
              </span>
            </span>
          </form>
        </div>

        {/* SLIDING OVERLAY CONTAINER */}
        <div className="split-overlay-container">
          <div className="split-overlay">
            <div className="overlay-slide overlay-slide-left">
              <h2>WELCOME!</h2>
            </div>
            <div className="overlay-slide overlay-slide-right">
              <h2>WELCOME BACK!</h2>
            </div>
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

// DevCredentialsPanel Component
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
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); onSeed(); }}
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