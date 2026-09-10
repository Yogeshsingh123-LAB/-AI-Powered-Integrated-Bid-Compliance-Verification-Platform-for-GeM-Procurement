import test from 'node:test';
import assert from 'node:assert/strict';
import { fitWindow, resizeWindow } from '../src/components/chatWindow.js';
test('moving and viewport changes keep the full panel reachable', () => {
  const desktop = { width: 1200, height: 800 };
  assert.deepEqual(fitWindow({ x: -500, y: 900, width: 420, height: 600 }, desktop), { x: 8, y: 192, width: 420, height: 600 });
  assert.deepEqual(fitWindow({ x: 700, y: 100, width: 420, height: 600 }, { width: 320, height: 300 }), { x: 8, y: 8, width: 304, height: 284 });
});
test('every resize edge respects viewport and minimum size without moving the opposite edge', () => {
  const rect = { x: 200, y: 150, width: 420, height: 600 }, view = { width: 1400, height: 900 };
  for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    for (const delta of [-3000, 3000]) {
      const r = resizeWindow(rect, edge, delta, delta, view);
      assert.ok(r.x >= 8 && r.y >= 8 && r.x + r.width <= 1392 && r.y + r.height <= 892);
      assert.ok(r.width >= 340 && r.height >= 420);
      if (edge.includes('w')) assert.equal(r.x + r.width, rect.x + rect.width);
      if (edge.includes('n')) assert.equal(r.y + r.height, rect.y + rect.height);
    }
  }
});
