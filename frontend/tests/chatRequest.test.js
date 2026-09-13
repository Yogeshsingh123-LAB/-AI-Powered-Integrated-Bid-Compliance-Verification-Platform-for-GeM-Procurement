import test from 'node:test';
import assert from 'node:assert/strict';
import { requestChatJson, buildChatHistory, validateChatResponse } from '../src/components/chatRequest.js';
import { translations } from '../src/components/chatText.js';

function state(overrides = {}) {
  const errors = [];
  return { errors, settings: { signal: new AbortController().signal, quiet: false, isCurrent: () => true, onError: value => errors.push(value), translations: translations.en, ...overrides } };
}

test('long provider replies remain visible but cannot invalidate the next request', () => {
  const messages = [{ id: 'welcome', role: 'assistant', content: 'Welcome' },
    { role: 'user', content: 'Hello' }, { role: 'assistant', content: '🙂'.repeat(4500) },
    { role: 'assistant', content: 'Failed', isError: true }];
  const history = buildChatHistory(messages);
  assert.equal(history.length, 2);
  assert.equal(Array.from(history[1].content).length, 4000);
  assert.equal(Array.from(messages[2].content).length, 4500);
  assert.equal(buildChatHistory(Array.from({ length: 15 }, () => ({ role: 'user', content: 'Hello' }))).length, 10);
});

test('malformed successful responses are rejected before rendering', () => {
  for (const data of [null, {}, { answer: null }, { answer: '' }, { answer: '  ' }, { answer: 42 }]) {
    assert.throws(() => validateChatResponse(data));
  }
  assert.deepEqual(validateChatResponse({ answer: 'Reply', suggestions: ['Next?', null, {}, ''] }).suggestions, ['Next?']);
  assert.deepEqual(validateChatResponse({ answer: 'Reply', suggestions: 'bad' }).suggestions, []);
});
test('quiet HTTP, network, timeout and JSON failures do not change form errors', async () => {
  for (const fetcher of [
    async () => new Response('', { status: 500 }),
    async () => { throw new TypeError('Network unavailable'); },
    async () => { throw new DOMException('Timeout', 'AbortError'); },
    async () => new Response('invalid json'),
  ]) {
    const { errors, settings } = state({ quiet: true });
    assert.equal(await requestChatJson(fetcher, '/api/chat', {}, settings), null);
    assert.deepEqual(errors, []);
  }
});
test('foreground errors and timeouts are still visible and localized', async () => {
  const { errors, settings } = state({ translations: translations.hi });
  await requestChatJson(async () => new Response('', { status: 404 }), '/api/chat', {}, settings);
  await requestChatJson(async () => { throw new DOMException('Timeout', 'AbortError'); }, '/api/chat', {}, settings);
  assert.deepEqual(errors, [translations.hi.missing, translations.hi.error]);
});
test('caller headers survive and JSON content type is enforced without mutation', async () => {
  const headers = new Headers({ Accept: 'application/json', 'If-Match': 'revision-1', 'Content-Type': 'text/plain' });
  const { settings } = state();
  const result = await requestChatJson(async (path, options) => {
    assert.equal(path, '/api/chat');
    assert.equal(options.headers.get('Accept'), 'application/json');
    assert.equal(options.headers.get('If-Match'), 'revision-1');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.equal(options.signal, settings.signal);
    assert.equal(options.method, 'POST');
    return Response.json({ ok: true });
  }, '/api/chat', { method: 'POST', headers }, settings);
  assert.deepEqual(result, { ok: true });
  assert.equal(headers.get('Content-Type'), 'text/plain');
});
test('late success or failure from an abandoned panel is ignored', async () => {
  for (const response of [Response.json({ private: 'old account' }), new Response('', { status: 500 })]) {
    let finish, current = true;
    const { errors, settings } = state({ isCurrent: () => current });
    const pending = requestChatJson(() => new Promise(resolve => { finish = resolve; }), '/api/chat', {}, settings);
    current = false;
    finish(response);
    assert.equal(await pending, null);
    assert.deepEqual(errors, []);
  }
});
test('late quiet failure cannot replace a successful foreground result', async () => {
  let finish;
  const { errors, settings } = state();
  const poll = requestChatJson(() => new Promise(resolve => { finish = resolve; }), '/api/poll', {}, { ...settings, quiet: true });
  assert.deepEqual(await requestChatJson(async () => Response.json({ status: 'open' }), '/api/ticket', {}, settings), { status: 'open' });
  finish(new Response('', { status: 500 }));
  await poll;
  assert.deepEqual(errors, []);
  assert.deepEqual(await requestChatJson(async () => new Response(null, { status: 204 }), '/api/presence', {}, settings), {});
});
