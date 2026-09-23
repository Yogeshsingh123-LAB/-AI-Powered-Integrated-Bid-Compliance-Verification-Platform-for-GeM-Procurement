import React, { useEffect, useState } from "react";
import { onToast } from "../services/toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ICONS = {
  success: <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />,
  error: <AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} />,
  info: <Info size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
};

/**
 * Renders the toast queue. Mount once near the app root. Replaces
 * window.alert() so users are not blocked and screen readers can follow.
 */
export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const off = onToast((t) => {
      setToasts((prev) => [...prev.slice(-4), t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4200);
    });
    return off;
  }, []);

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 380,
        width: "calc(100% - 40px)"
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "#0f172a",
            color: "#f1f5f9",
            borderRadius: 10,
            padding: "12px 14px",
            boxShadow: "0 10px 30px rgba(2, 6, 23, .4)",
            fontSize: 13.5,
            lineHeight: 1.45,
            borderLeft: `3px solid ${t.type === "success" ? "#16a34a" : t.type === "error" ? "#dc2626" : "#2563eb"}`
          }}
        >
          {ICONS[t.type] || ICONS.info}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
