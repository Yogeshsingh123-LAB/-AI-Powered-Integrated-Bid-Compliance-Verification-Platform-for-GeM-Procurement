import { apiFetch, BACKEND_URL } from "./services/api";
import { lazy, Suspense, useState, useEffect } from "react";
import Login from "./pages/Login";
import "./App.css";

const Home = lazy(() => import("./pages/Home"));
const Chatbot = lazy(() => import("./components/Chatbot"));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("Supplier"); // Supplier (BIDDER) or Buyer (OFFICER/ADMIN)
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const API_BASE = BACKEND_URL;

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem("gem_token");
    if (token) {
      apiFetch(`${API_BASE}/api/auth/me`, {
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
      apiFetch(`${API_BASE}/api/auth/logout`, {
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
        <Suspense fallback={<div role="status">Loading your workspace...</div>}>
          <Home role={userRole} user={currentUser} onLogout={handleLogout} />
          <Chatbot userRole={userRole} />
        </Suspense>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
