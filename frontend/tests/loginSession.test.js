import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readLoginSession } from '../src/services/loginSession.js';

const session = { access_token: 'header.payload.signature', user: { id: 'user-id', role: 'BIDDER' } };

test('valid server login response preserves the issued token and account', async () => {
  assert.deepEqual(await readLoginSession(Response.json(session)), session);
});

test('fake demo tokens, missing tokens, incomplete users and static HTML cannot establish a session', async () => {
  for (const data of [
    {}, { ...session, access_token: 'demo-token-12345' },
    { ...session, access_token: 'demo-jwt-token-12345' },
    { ...session, access_token: undefined }, { ...session, user: null },
    { ...session, user: { id: 'user-id' } },
  ]) {
    await assert.rejects(readLoginSession(Response.json(data)), /valid session/);
  }
  await assert.rejects(readLoginSession(new Response('<html>Frontend fallback</html>')), /valid session/);
});

test('authentication and server errors remain failures', async () => {
  await assert.rejects(readLoginSession(Response.json({ detail: 'Incorrect credentials' }, { status: 401 })), /Incorrect credentials/);
  await assert.rejects(readLoginSession(Response.json({ success: false, detail: 'Unavailable' }, { status: 503 })), /Unavailable/);
});

test('login page contains no route that fabricates an authenticated demo session', async () => {
  const source = await readFile(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /demo-(?:jwt-)?token|mockToken|mockUser|Quick Demo Workspace Access/);
});
