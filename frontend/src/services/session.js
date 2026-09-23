// Session storage for the platform.
//
// SECURITY: the JWT is kept in memory only (module scope). Browsers
// authenticate via the HttpOnly session cookie set by the API at login, which
// JavaScript cannot read — a successful XSS can therefore not exfiltrate the
// bearer token. The in-memory token is used to add an Authorization header as
// defense-in-depth and is lost on page reload (the cookie restores the
// session via GET /api/auth/me).
//
// WebSocket handshakes (which cannot carry cookies) use short-lived tickets
// from GET /api/auth/ws-token, fetched at connect time.

let inMemoryToken = null;
let inMemoryUser = null;

export function setSession(token, user) {
  inMemoryToken = typeof token === "string" && token ? token : null;
  inMemoryUser = user || null;
}

export function getSessionToken() {
  return inMemoryToken;
}

export function getSessionUser() {
  return inMemoryUser;
}

export function hasSession() {
  return Boolean(inMemoryToken || inMemoryUser);
}

export function clearSession() {
  inMemoryToken = null;
  inMemoryUser = null;
}
