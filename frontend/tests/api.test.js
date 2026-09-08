import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, apiUrl, websocketUrl } from '../src/services/api.js';

globalThis.window = { location: { origin: 'https://frontend.example.com' } };
globalThis.localStorage = { getItem: () => 'test-token' };

test('same-origin API and WebSocket URLs support HTTPS and tender slashes', () => {
  assert.equal(apiUrl('/api/auth/me'), '/api/auth/me');
  assert.equal(websocketUrl('/api/v1/monitoring/tender/GEM%2F2026%2F001'),
    'wss://frontend.example.com/api/v1/monitoring/tender/GEM%2F2026%2F001');
});

test('authenticated requests preserve caller headers, body and abort signal', async () => {
  const body = new FormData();
  body.append('bid_id', 'sample');
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents/upload');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.headers.get('X-Test'), 'value');
    assert.equal(options.headers.has('Content-Type'), false);
    assert.equal(options.body, body);
    assert.equal(options.signal, controller.signal);
    return { ok: true };
  };
  await apiFetch('/api/documents/upload', { method: 'POST', body,
    headers: { 'X-Test': 'value' }, signal: controller.signal });
});

test('never sends a session token to third-party or non-API URLs', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.has('Authorization'), false);
    return { ok: true };
  };
  await apiFetch('https://storage.example.com/private-document');
  await apiFetch('/assets/logo.png');
});

test('keeps an explicitly supplied Authorization header', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Authorization'), 'Bearer caller-token');
    return { ok: true };
  };
  await apiFetch('/api/users/me', { headers: { Authorization: 'Bearer caller-token' } });
});
