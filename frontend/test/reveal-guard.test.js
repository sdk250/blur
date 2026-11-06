import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRevealGuard } from '../js/reveal-guard.js';

test('触屏第一下只展开：紧接着的点击被吞掉', () => {
  const g = createRevealGuard();
  g.pointerDown('touch', false);
  assert.equal(g.takeClick(), false);
});

test('已展开后再点，正常触发', () => {
  const g = createRevealGuard();
  g.pointerDown('touch', false); g.takeClick();
  g.pointerDown('touch', true);
  assert.equal(g.takeClick(), true);
});

test('鼠标不受影响', () => {
  const g = createRevealGuard();
  g.pointerDown('mouse', false);
  assert.equal(g.takeClick(), true);
});

test('只吞一次', () => {
  const g = createRevealGuard();
  g.pointerDown('pen', false);
  assert.equal(g.takeClick(), false);
  assert.equal(g.takeClick(), true);
});
