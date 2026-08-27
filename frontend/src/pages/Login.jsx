import React, { useState } from "react";

function Login({ onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login states
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState("G7K4P");

  // Sign Up states
  const [signUpId, setSignUpId] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Supplier");

  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";
    for (let i = 0; i < 5; i++) {
      newCaptcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(newCaptcha);
    setCaptcha("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      alert("Please enter Login ID and Password");
      return;
    }
    if (!captcha) {
      alert("Please enter Captcha");
      return;
    }
    if (captcha.toUpperCase() !== captchaText) {
      alert("Invalid Captcha");
      generateCaptcha();
      return;
    }
    const detectedRole = loginId.toLowerCase().includes("admin") ? "Admin" : "Procurement Officer";
    alert(`Login Successful as ${detectedRole}!`);
    onLogin(detectedRole);
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (!signUpId || !signUpEmail || !signUpPassword || !organization) {
      alert("Please fill all required fields");
      return;
    }
    alert("Sign Up Successful! Please log in.");
    setIsSignUp(false); // Switch back to Sign In
  };

  // 3D Parallax Tilt Logic
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rx = -(y / (box.height / 2)) * 12; // cap at 12 deg tilt
    const ry = (x / (box.width / 2)) * 12; // cap at 12 deg tilt
    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="login-3d-page-wrapper">
      <div 
        className={`login-container ${isSignUp ? "right-panel-active" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* SIGN UP PANEL */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h2>Register</h2>
            
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={signUpId} 
                onChange={(e) => setSignUpId(e.target.value)} 
                required 
              />
              <span className="input-icon-right">👤</span>
            </div>

            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                value={signUpEmail} 
                onChange={(e) => setSignUpEmail(e.target.value)} 
                required 
              />
              <span className="input-icon-right">✉</span>
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={signUpPassword} 
                onChange={(e) => setSignUpPassword(e.target.value)} 
                required 
              />
              <span className="input-icon-right">🔒</span>
            </div>

            <div className="input-group">
              <label>Organization</label>
              <input 
                type="text" 
                value={organization} 
                onChange={(e) => setOrganization(e.target.value)} 
                required 
              />
              <span className="input-icon-right">🏢</span>
            </div>

            <div className="input-group select-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Supplier">Supplier / Seller</option>
                <option value="Buyer">Buyer / Officer</option>
              </select>
            </div>

            <button type="submit" className="neon-button">Register</button>
            
            <span className="toggle-text">
              Already have an account?{" "}
              <span className="toggle-link" onClick={() => setIsSignUp(false)}>
                Sign in
              </span>
            </span>
          </form>
        </div>

        {/* SIGN IN PANEL */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={loginId} 
                onChange={(e) => setLoginId(e.target.value)} 
                required 
              />
              <span className="input-icon-right">👤</span>
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🔓" : "🔒"}
              </button>
            </div>



            {/* Captcha */}
            <div className="captcha-section">
              <div className="captcha-header">
                <span className="captcha-label">Captcha:</span>
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
                    ↻
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

            <button type="submit" className="neon-button">Login</button>
            
            <span className="toggle-text">
              Don't have an account?{" "}
              <span className="toggle-link" onClick={() => setIsSignUp(true)}>
                Sign Up
              </span>
            </span>
          </form>
        </div>

        {/* OVERLAY PANEL */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h2>WELCOME!</h2>
            </div>
            
            <div className="overlay-panel overlay-right">
              <h2>WELCOME BACK!</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;