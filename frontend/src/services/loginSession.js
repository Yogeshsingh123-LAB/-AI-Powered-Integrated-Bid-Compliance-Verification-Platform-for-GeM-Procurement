import { safeJson } from './api.js';

// This checks the response contract only. The API verifies JWT signatures and
// account access on every protected request.
export async function readLoginSession(response) {
  const data = await safeJson(response);
  if (!response?.ok || data?.success === false) {
    throw new Error(data?.detail || data?.message || 'Authentication failed. Check your credentials.');
  }
  if (typeof data?.access_token !== 'string' ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.access_token) ||
      typeof data.user?.id !== 'string' || !data.user.id ||
      typeof data.user?.role !== 'string' || !data.user.role.trim()) {
    throw new Error('The sign-in server did not return a valid session. Please try again or contact support.');
  }
  return data;
}
