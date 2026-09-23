import React, { useState } from "react";
import { apiFetch, safeJson } from "../services/api";
import { Lock, ShieldAlert, Eye, EyeOff } from "lucide-react";

/**
 * Shown (and API-enforced with HTTP 423) for accounts flagged
 * `must_change_password` — e.g. the first-login bootstrap admin or
 * admin-provisioned users. Until the password is rotated the rest of the
 * application is not reachable.
 */
function ForcedPasswordChange({ user, onDone, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.detail || "Password change failed.");
      // Re-issue the session with the new password so the token's
      // must_change_password claim is cleared.
      const loginRes = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, password: newPassword })
      });
      const loginData = await safeJson(loginRes);
      if (!loginRes.ok) throw new Error(loginData?.detail || "Re-login after password change failed.");
      onDone(loginData);
    } catch (err) {
      setError(err.message || "Password change failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 24
      }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#b45309", marginBottom: 12 }}>
          <ShieldAlert size={22} />
          <h2 style={{ margin: 0, fontSize: 18 }}>Password change required</h2>
        </div>
        <p style={{ color: "#475569", fontSize: 14, marginBottom: 20 }}>
          Your account is using a provisional credential. For security you must set a new
          password before accessing the platform.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#334155" }}>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#334155" }}>
            New password
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                style={{ padding: "10px 40px 10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, width: "100%", boxSizing: "border-box" }}
              />
              <button
                type="button"
                aria-label={showNew ? "Hide password" : "Show password"}
                onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#334155" }}>
            Confirm new password
            <input
              type={showNew ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
            />
          </label>
          <div aria-live="assertive" style={{ minHeight: 18 }}>
            {error && <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "#ea580c", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer"
            }}
          >
            <Lock size={15} />
            {loading ? "Updating..." : "Set new password"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}
          >
            Cancel and log out
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForcedPasswordChange;
