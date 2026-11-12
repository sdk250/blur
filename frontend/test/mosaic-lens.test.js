import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lensFor } from '../js/mosaic-lens.js';

const C = 100; // 格子边长
const sq = (c, r, n = 1) => ({ left: c * C, top: r * C, size: n * C - 4 });
const OPT = { radius: 220, grow: 10, hitGrow: 12 };

test('鼠标所在的格子最大且标为命中，周围一圈也放大，越远越小，远处不动', () => {
  const rects = [sq(0, 0), sq(1, 0), sq(2, 0), sq(3, 0), sq(9, 0)];
  const out = lensFor(rects, { x: 50, y: 50 }, OPT);
  assert.equal(out[0].hit, true);
  assert.deepEqual(out.slice(1).map(o => o.hit), [false, false, false, false]);
  assert.ok(out[0].scale > out[1].scale);
  assert.ok(out[1].scale > out[2].scale && out[2].scale > out[3].scale);
  assert.ok(out[1].scale > 1.03, '紧挨着的一圈要明显放大');
  assert.equal(out[4].scale, 1);
});

test('放大量按像素算：同样贴着鼠标，大格子放大的倍数更小', () => {
  const out = lensFor([sq(0, 0, 3), sq(3, 0)], { x: 290, y: 150 }, OPT);
  assert.equal(out[0].hit, true);
  const big = lensFor([sq(0, 0, 3)], { x: 150, y: 150 }, OPT)[0].scale;
  const small = lensFor([sq(0, 0)], { x: 50, y: 50 }, OPT)[0].scale;
  assert.ok(big < small);
  assert.ok(Math.abs((big - 1) * 296 - (small - 1) * 96) < 1e-9, '两者长出的像素一样');
});

test('命中的格子层级最高；鼠标落在缝里时没有命中，但周围照样放大', () => {
  const rects = [sq(0, 0), sq(1, 0)];
  const out = lensFor(rects, { x: 98, y: 50 }, OPT); // 0 号格子右边缘是 96，缝在 96–100
  assert.deepEqual(out.map(o => o.hit), [false, false]);
  assert.ok(out[0].scale > 1 && out[1].scale > 1);
  const hit = lensFor(rects, { x: 50, y: 50 }, OPT);
  assert.ok(hit[0].z > hit[1].z);
});

test('没有鼠标位置时全部复原', () => {
  assert.deepEqual(lensFor([sq(0, 0)], null, OPT), [{ scale: 1, hit: false, z: 0 }]);
});
