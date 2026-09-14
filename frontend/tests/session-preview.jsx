// Local UI regression harness. Never sends a request to the real backend.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import '../src/index.css';

if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Local fixtures only');
const user = { id: 'fixture-user', full_name: 'Test Supplier', role: 'BIDDER', email: 'fixture@example.com' };
const signedIn = sessionStorage.getItem('session-fixture') === 'signed-in';
localStorage.removeItem('gem_token');
localStorage.removeItem('gem_user');
if (signedIn) localStorage.setItem('gem_token', 'fixture.payload.signature');
window.fetch = async (input) => {
  const path = new URL(input, location.origin).pathname;
  if (path.endsWith('/auth/me')) return Response.json(user);
  if (path.endsWith('/api/chat')) return Response.json({ answer: 'Fixture reply', source: 'knowledge_base', suggestions: [] });
  if (path.endsWith('/biometric/status')) return Response.json({ enabled: false });
  if (path.endsWith('/auth/login')) return Response.json({ detail: 'Fixture login failure' }, { status: 401 });
  return Response.json([]);
};
createRoot(document.getElementById('fixture-controls')).render(<div>
  {['signed-out', 'signed-in'].map(mode => <button key={mode} onClick={() => {
    sessionStorage.setItem('session-fixture', mode); location.assign('/tests/session-preview.html');
  }}>Load {mode} fixture</button>)}
</div>);
createRoot(document.getElementById('root')).render(<App />);
