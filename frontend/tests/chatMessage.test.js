import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderChatMessage } from '../src/components/chatMessage.js';

const render = text => renderToStaticMarkup(createElement('div', null, renderChatMessage(text)));
test('assistant instructions render each paired marker as semantic bold', () => {
  assert.equal(render('Go to **Verification** (or **Bidders**).\nOpen **Compliance** or **Audit Trail**.\nUse **Help** or **Support**.'),
    '<div>Go to <strong>Verification</strong> (or <strong>Bidders</strong>).\nOpen <strong>Compliance</strong> or <strong>Audit Trail</strong>.\nUse <strong>Help</strong> or <strong>Support</strong>.</div>');
});
test('regional text and single-letter bold render correctly', () => {
  assert.equal(render('**आवेदन** **தமிழ்** **A**'), '<div><strong>आवेदन</strong> <strong>தமிழ்</strong> <strong>A</strong></div>');
});
test('unpaired, escaped and arithmetic asterisks remain literal', () => {
  for (const text of ['2 * 3 = 6', '2 ** 3 = 8', '**unfinished', 'normal text', '\\**literal**', '** **', '****']) {
    assert.equal(render(text), `<div>${text}</div>`);
  }
});
test('HTML in assistant output stays escaped, including inside bold', () => {
  assert.equal(render('**<img src=x onerror=alert(1)>**<script>alert(1)</script>'),
    '<div><strong>&lt;img src=x onerror=alert(1)&gt;</strong>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
});
