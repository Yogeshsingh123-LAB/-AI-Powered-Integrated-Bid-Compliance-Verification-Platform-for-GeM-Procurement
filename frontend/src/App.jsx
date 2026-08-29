import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Chatbot from "./components/Chatbot";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("Supplier"); // Supplier (BIDDER) or Buyer (OFFICER/ADMIN)
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem("gem_token");
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Session expired or invalid token");
        }
        return res.json();
      })
      .then((user) => {
        setCurrentUser(user);
        setUserRole(user.role.toUpperCase() === "BIDDER" ? "Supplier" : "Buyer");
        setIsLoggedIn(true);
      })
      .catch((err) => {
        console.warn("Auto-login failed:", err.message);
        // Clear stale session details
        localStorage.removeItem("gem_token");
        localStorage.removeItem("gem_user");
      })
      .finally(() => {
        setSessionLoading(false);
      });
    } else {
      setSessionLoading(false);
    }
  }, [API_BASE]);

  const handleLogin = (token, user) => {
    localStorage.setItem("gem_token", token);
    localStorage.setItem("gem_user", JSON.stringify(user));
    setCurrentUser(user);
    setUserRole(user.role.toUpperCase() === "BIDDER" ? "Supplier" : "Buyer");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    const token = localStorage.getItem("gem_token");
    if (token) {
      // Call logout endpoint in background (silent audit entry)
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }).catch((e) => console.error("Silent logout audit fail:", e));
    }
    
    // Clear storage
    localStorage.removeItem("gem_token");
    localStorage.removeItem("gem_user");
    
    // Reset state
    setCurrentUser(null);
    setUserRole("Supplier");
    setIsLoggedIn(false);
  };

  if (sessionLoading) {
    return (
      <div className="login-3d-page-wrapper">
        <div style={{ color: "#94a3b8", fontFamily: "var(--mono)", fontSize: "1.2rem", zIndex: 10 }}>
          Verifying Security Credentials...
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <Home role={userRole} user={currentUser} onLogout={handleLogout} />
          <Chatbot userRole={userRole} />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
