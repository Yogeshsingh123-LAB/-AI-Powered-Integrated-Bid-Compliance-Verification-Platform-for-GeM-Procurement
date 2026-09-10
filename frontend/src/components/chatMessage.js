import { createElement } from 'react';

// Render the assistant's inline **emphasis** as React nodes, never as raw HTML.
// Keep unmatched markers, ordinary multiplication signs and line breaks intact.
export function renderChatMessage(text) {
  const parts = [];
  const pattern = /(?<![\\*])\*\*(?![\s*])([^\n]+?)(?<![\s\\])\*\*(?!\*)/gu;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(cursor, match.index));
    parts.push(createElement('strong', { key: match.index }, match[1]));
    cursor = match.index + match[0].length;
  }
  parts.push(text.slice(cursor));
  return parts;
}
