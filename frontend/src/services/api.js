// Use VITE_API_URL for separate frontend/backend hosting. An empty value uses
// the same origin (Vite's development proxy or the production Nginx proxy).
export const BACKEND_URL = (import.meta.env?.VITE_API_URL || "").trim().replace(/\/+$/, "");

export function apiUrl(path) {
  return `${BACKEND_URL}/${path.replace(/^\/+/, "")}`;
}

export function websocketUrl(path) {
  const url = new URL(apiUrl(path), window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function apiFetch(input, options = {}) {
  const url = typeof input === "string" && input.startsWith("/api/") ? apiUrl(input) : input;
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("gem_token");
  const target = new URL(url, window.location.origin);
  const backend = new URL(BACKEND_URL || window.location.origin);
  if (token && target.origin === backend.origin && target.pathname.startsWith("/api/") && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
