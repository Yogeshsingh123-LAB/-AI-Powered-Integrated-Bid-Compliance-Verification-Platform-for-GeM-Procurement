import { apiFetch, BACKEND_URL, setDemoMode } from "./services/api";
import { setSession, clearSession } from "./services/session";
import { lazy, Suspense, useState, useEffect } from "react";
import Login from "./pages/Login";
import LandingPage from "./components/LandingPage";
import LegalPages, { LEGAL_VIEWS } from "./components/LegalPages";
import ForcedPasswordChange from "./components/ForcedPasswordChange";
import Toaster from "./components/Toaster";
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
      if (LEGAL_VIEWS.some((v) => path === `/${v}`)) return "legal";
    }
    return "landing";
  });
  const [legalPage, setLegalPage] = useState(() => {
    if (typeof window !== "undefined") {
      const seg = window.location.pathname.toLowerCase().replace(/^\/+/, "").split("/")[0];
      if (LEGAL_VIEWS.includes(seg)) return seg;
    }
    return "privacy";
  });
  const [targetSection, setTargetSection] = useState("home");

  const navigateTo = (view, section = "home") => {
    setTargetSection(section);
    setAuthView(view);
    if (typeof window !== "undefined") {
      let targetPath = "/";
      if (view === "login") targetPath = "/login";
      else if (view === "register") targetPath = "/register";
      else if (view === "legal") targetPath = `/${section || "privacy"}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, "", targetPath);
      }
    }
  };

  const navigateLegal = (page) => {
    setLegalPage(page);
    navigateTo("legal", page);
  };

  const handleNavigateSection = (sectionId) => {
    navigateTo("landing", sectionId);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/^\/+/, "");
      const seg = path.split("/")[0];
      if (path === "login" || path.startsWith("login")) {
        setAuthView("login");
      } else if (path === "register" || path === "signup" || path.startsWith("signup")) {
        setAuthView("register");
      } else if (LEGAL_VIEWS.includes(seg)) {
        setLegalPage(seg);
        setAuthView("legal");
      } else {
        setAuthView("landing");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const API_BASE = BACKEND_URL;

  // Restore session on mount. The JWT lives in an HttpOnly cookie set by the
  // API at login, so GET /api/auth/me with credentials authenticates the
  // browser even after a full page reload (no localStorage involved).
  useEffect(() => {
    apiFetch(`${API_BASE}/api/auth/me`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Session expired or invalid");
        }
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("Invalid response format from server");
      })
      .then((user) => {
        setSession(null, user);
        setCurrentUser(user);
        setUserRole(user.role.toUpperCase() === "BIDDER" ? "Supplier" : "Buyer");
        setIsLoggedIn(true);
      })
      .catch((err) => {
        console.warn("Auto-login failed:", err.message);
        clearSession();
      })
      .finally(() => {
        setSessionLoading(false);
      });
  }, [API_BASE]);

  const handleLogin = (token, user) => {
    setDemoMode(false);
    setIsDemo(false);
    setSession(token, user);
    setCurrentUser(user);
    setUserRole(user.role.toUpperCase() === "BIDDER" ? "Supplier" : "Buyer");
    setIsLoggedIn(true);
  };

  const handleDemo = (portal) => {
    // Keep a demo visit separate from account/session persistence.
    clearSession();
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
    // Call logout endpoint in background (server clears the HttpOnly cookie
    // and writes the audit entry); credentials let the cookie authenticate it.
    apiFetch(`${API_BASE}/api/auth/logout`, { method: "POST" })
      .catch((e) => console.error("Silent logout audit fail:", e));

    // Clear in-memory session (cookie is cleared server-side)
    clearSession();

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

  // Accounts flagged must_change_password (bootstrap / admin-provisioned) are
  // locked out of the workspace (and the API returns 423) until the password
  // is rotated through this screen.
  if (isLoggedIn && currentUser && currentUser.must_change_password) {
    return (
      <ForcedPasswordChange
        user={currentUser}
        onDone={({ access_token, user: freshUser }) =>
          handleLogin(access_token, { ...freshUser, must_change_password: false })
        }
        onLogout={handleLogout}
      />
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
          onNavigateLegal={navigateLegal}
        />
      ) : authView === "legal" ? (
        <LegalPages
          page={legalPage}
          onNavigateLegal={navigateLegal}
          onBackToHome={() => navigateTo("landing", "home")}
          onOpenLogin={() => navigateTo("login")}
        />
      ) : (
        <Login
          initialIsSignUp={authView === "register"}
          onBackToHome={() => navigateTo("landing", "home")}
          onNavigateSection={handleNavigateSection}
          onNavigateLegal={navigateLegal}
          onLogin={handleLogin}
          onDemo={handleDemo}
        />
      )}
      <Toaster />
    </>
  );
}

export default App;
