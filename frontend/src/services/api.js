// Use VITE_API_URL for separate frontend/backend hosting. An empty value uses
// the same origin (Vite's development proxy or the production Nginx proxy).
export const BACKEND_URL = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000").trim().replace(/\/+$/, "");

// Demo access is local UI state, never an authentication credential.
let demoMode = false;
export function setDemoMode(enabled) { demoMode = Boolean(enabled); }
export function isDemoMode() { return demoMode; }

export function apiUrl(path) {
  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
}

export function websocketUrl(path) {
  const url = new URL(apiUrl(path), window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function apiFetch(input, options = {}) {
  if (demoMode) {
    return Promise.resolve(Response.json({
      success: false, detail: 'Demo mode: sign in to access live data or save changes.',
    }, { status: 403 }));
  }
  const url = typeof input === "string" && input.startsWith("/api/") ? apiUrl(input) : input;
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("gem_token");
  try {
    const target = new URL(url, window.location.origin);
    const backend = new URL(BACKEND_URL || window.location.origin);
    if (token && target.origin === backend.origin && target.pathname.startsWith("/api/") && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(url, { ...options, headers });
}

export async function safeJson(response) {
  if (!response) {
    return { success: false, detail: "No response received from authentication server." };
  }
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    }
    const text = await response.text();
    if (!response.ok) {
      return {
        success: false,
        detail: `Server returned HTTP ${response.status}: ${text.substring(0, 120) || response.statusText}`
      };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, message: text };
    }
  } catch {
    return {
      success: false,
      detail: response.ok
        ? "Failed to parse server response."
        : `Server communication error (HTTP ${response.status}). Please try again.`
    };
  }
}

