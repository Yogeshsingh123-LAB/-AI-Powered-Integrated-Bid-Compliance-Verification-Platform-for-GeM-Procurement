import React, { useState } from "react";

function Login({ onLogin }) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState("G7K4P");

  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";

    for (let i = 0; i < 5; i++) {
      newCaptcha += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
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

    alert("Login Successful!");
    onLogin();
  };

  const handleCancel = () => {
    setLoginId("");
    setPassword("");
    setCaptcha("");
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <div className="login-left">

        <div className="brand-section">

          <div className="brand-shield">
            🛡️
          </div>

          <h1>
            GeM
            <br />
            <span>Procurement</span>
          </h1>

          <p className="brand-subtitle">
            Government e-Marketplace
          </p>

          <p className="brand-description">
            Central Public Procurement Portal
          </p>

        </div>


        <div className="welcome-section">

          <h2>
            Welcome to
            <br />
            <span>GeM Procurement</span>
          </h2>

          <p>
            Access your procurement dashboard, manage compliance
            documents and track your application status.
          </p>


          <div className="secure-box">

            <div className="secure-icon">
              🛡️
            </div>

            <div>
              <h3>Secure Portal</h3>

              <p>
                Login securely to access your GeM Procurement account.
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="login-card">

          <div className="login-card-title">

            <h2>Welcome Back!</h2>

            <p>
              Sign in to your procurement portal
            </p>

          </div>


          <form onSubmit={handleLogin}>

            {/* Login ID */}
            <div className="form-group">

              <label>
                Login ID <span>*</span>
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter Login ID"
                />

              </div>

            </div>


            {/* Password */}
            <div className="form-group">

              <label>
                Password <span>*</span>
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>


            {/* Captcha */}
            <div className="form-group">

              <label>
                Captcha
              </label>

              <div className="captcha-container">

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


            {/* Captcha Input */}
            <div className="form-group">

              <label>
                Captcha Text <span>*</span>
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🛡️
                </span>

                <input
                  type="text"
                  value={captcha}
                  onChange={(e) =>
                    setCaptcha(e.target.value)
                  }
                  placeholder="Enter Captcha"
                />

              </div>

            </div>


            {/* Buttons */}
            <div className="login-buttons">

              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="proceed-btn"
              >
                Sign In
              </button>

            </div>

          </form>


          {/* Forgot Password */}
          <div className="forgot-password">

            <button type="button">
              Generate / Forgot Password?
            </button>

          </div>


          {/* Register */}
          <div className="register-text">
            New to GeM Procurement?
            <button type="button">
              Register
            </button>
          </div>

        </div>

      </div>


      {/* FOOTER */}
      <div className="login-footer">
        © 2026 GeM Procurement Portal. All rights reserved.
      </div>

    </div>
  );
}

export default Login;