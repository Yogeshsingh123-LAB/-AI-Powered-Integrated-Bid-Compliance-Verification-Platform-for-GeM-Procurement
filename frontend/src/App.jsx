import { apiFetch, BACKEND_URL, setDemoMode } from "./services/api";
import { lazy, Suspense, useState, useEffect } from "react";
import Login from "./pages/Login";
import LandingPage from "./components/LandingPage";
import "./App.css";
import "./demoMode.css";

const Home = lazy(() => import("./pages/Home"));
const Chatbot = lazy(() => import("./components/Chatbot"));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [userRole, setUserRole] = useState("Supplier"); // Supplier (BIDDER) or Buyer (OFFICER/ADMIN)
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authView, setAuthView] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path === "/login" || path.startsWith("/login")) return "login";
      if (path === "/register" || path === "/signup") return "register";
    }
    return "landing";
  });
  const [targetSection, setTargetSection] = useState("home");

  const navigateTo = (view, section = "home") => {
    setTargetSection(section);
    setAuthView(view);
    if (typeof window !== "undefined") {
      const targetPath = view === "login" ? "/login" : view === "register" ? "/register" : "/";
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, "", targetPath);
      }
    }
  };

  const handleNavigateSection = (sectionId) => {
    navigateTo("landing", sectionId);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === "/login" || path.startsWith("/login")) {
        setAuthView("login");
      } else if (path === "/register" || path === "/signup") {
        setAuthView("register");
      } else {
        setAuthView("landing");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Invalid response format from server");
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
    setDemoMode(false);
    setIsDemo(false);
    localStorage.setItem("gem_token", token);
    localStorage.setItem("gem_user", JSON.stringify(user));
    setCurrentUser(user);
    setUserRole(user.role.toUpperCase() === "BIDDER" ? "Supplier" : "Buyer");
    setIsLoggedIn(true);
  };

  const handleDemo = (portal) => {
    // Keep a demo visit separate from account/session persistence.
    localStorage.removeItem("gem_token");
    localStorage.removeItem("gem_user");
    setDemoMode(true);
    setIsDemo(true);
    setIsLoggedIn(false);
    setUserRole(portal === "Buyer" ? "Buyer" : "Supplier");
    setCurrentUser({
      id: portal === "Buyer" ? "demo-officer" : "demo-bidder",
      full_name: portal === "Buyer" ? "Demo Procurement Officer" : "Demo Supplier",
      role: portal === "Buyer" ? "OFFICER" : "BIDDER",
      organization: "Sample organization",
    });
  };

  const exitDemo = () => {
    setDemoMode(false);
    setIsDemo(false);
    setCurrentUser(null);
    navigateTo("login");
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
    setAuthView("landing");
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
      {isLoggedIn || isDemo ? (
        <Suspense fallback={<div role="status">Loading your workspace...</div>}>
          {isDemo && <div className="demo-mode-banner" role="status">
            <span><strong>Demo mode</strong> — Sample workspace. Sign in to use the chatbot and live features.</span>
            <button type="button" onClick={exitDemo}>Exit demo / Sign in</button>
          </div>}
          <Home key={isDemo ? "demo-workspace" : `workspace-${currentUser?.id}`} role={userRole} user={currentUser} isDemo={isDemo} onLogout={isDemo ? exitDemo : handleLogout} />
          {isLoggedIn && !isDemo && <Chatbot key={`chat-${currentUser?.id}`} userRole={userRole} isSupportAdmin={currentUser?.role?.toUpperCase() === "ADMIN"} />}
        </Suspense>
      ) : authView === "landing" ? (
        <LandingPage
          initialSection={targetSection}
          onOpenLogin={() => navigateTo("login")}
          onOpenRegister={() => navigateTo("register")}
        />
      ) : (
        <Login
          initialIsSignUp={authView === "register"}
          onBackToHome={() => navigateTo("landing", "home")}
          onNavigateSection={handleNavigateSection}
          onLogin={handleLogin}
          onDemo={handleDemo}
        />
      )}
    </>
  );
}

export default App;
