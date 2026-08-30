import React, { useState, useEffect } from "react";
import { User, Lock, Mail, RefreshCw, ShieldCheck } from "lucide-react";

function Login({ onLogin }) {
  const [selectedPortal, setSelectedPortal] = useState("Supplier");
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
          setAuthError("Access Denied: Supplier accounts do not have clearance level permissions for the Audit Console Terminal.");
          setLoading(false);
          generateCaptcha();
          return;
        }
      }

      // Access control rule: Admin/Officer do not login to supplier terminal
      if (selectedPortal === "Supplier") {
        if (user.role.toUpperCase() !== "BIDDER") {
          setAuthError("Access Denied: Administrative accounts are not permitted to log in through the Supplier Terminal. Please switch to the Administrative Portal.");
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



  return (
    <div className="login-3d-page-wrapper">
      <div className={`login-card-container ${isSignUp ? "right-panel-active" : ""}`}>

        {/* SIGN IN CONTAINER */}
        <div className="form-side sign-in-side">
          <form onSubmit={handleLogin}>
            <h2>Login</h2>

            {/* Portal Selection Tabs */}
            <div className="portal-tabs">
              <button 
                type="button" 
                className={`portal-tab ${selectedPortal === "Supplier" ? "active" : ""}`}
                onClick={() => { setSelectedPortal("Supplier"); setAuthError(""); setSuccessMsg(""); }}
              >
                Bidder Portal
              </button>
              <button 
                type="button" 
                className={`portal-tab ${selectedPortal === "Buyer" ? "active" : ""}`}
                onClick={() => { setSelectedPortal("Buyer"); setAuthError(""); setSuccessMsg(""); }}
              >
                Administrative Console
              </button>
            </div>

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
              <img src="/logo.png" alt="BidVerify Logo" style={{ height: "80px", marginBottom: "12px", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
              <h2 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>BidVerify</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "6px", fontWeight: 600 }}>AI-Powered Integrated Compliance Platform</p>
            </div>
            <div className="overlay-slide overlay-slide-right">
              <img src="/logo.png" alt="BidVerify Logo" style={{ height: "80px", marginBottom: "12px", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
              <h2 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>BidVerify</h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "6px", fontWeight: 600 }}>Government e-Auction & Compliance Portal</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;