const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
export const BACKEND_URL = (import.meta.env?.VITE_API_URL || (isLocal ? "http://127.0.0.1:8000" : "")).trim().replace(/\/+$/, "");

// Demo access is local UI state, never an authentication credential.
let demoMode = false;
export function setDemoMode(enabled) { demoMode = Boolean(enabled); }
export function isDemoMode() { return demoMode; }

export function apiUrl(path) {
  const cleanPath = path.replace(/^\/+/, "");
  if (!BACKEND_URL) {
    return cleanPath.startsWith("api/") ? `/${cleanPath}` : `/api/${cleanPath}`;
  }
  return `${BACKEND_URL}/${cleanPath}`;
}

export function websocketUrl(path) {
  const base = apiUrl(path);
  const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function apiFetch(input, options = {}) {
  if (demoMode) {
    return Promise.resolve(Response.json({
      success: false, detail: 'Demo mode: sign in to access live data or save changes.',
    }, { status: 403 }));
  }
  let url = input;
  if (typeof input === "string") {
    if (input.startsWith("/api/")) {
      url = apiUrl(input);
    } else if (!isLocal && (input.startsWith("http://127.0.0.1:8000/api/") || input.startsWith("http://localhost:8000/api/"))) {
      const relPath = input.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, "");
      url = apiUrl(relPath);
    }
  }
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("gem_token");
  try {
    const target = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const backendOrigin = BACKEND_URL ? new URL(BACKEND_URL, window.location.origin).origin : window.location.origin;
    if (token && target.origin === backendOrigin && target.pathname.startsWith("/api/") && !headers.has("Authorization")) {
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

