import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutMosaic, captionBox } from '../js/mosaic-layout.js';
import { seeded } from './helpers.js';

const views = [{ w: 1600, h: 900 }, { w: 1280, h: 720 }, { w: 390, h: 844 }, { w: 2560, h: 1440 }];

test('格子之间不重叠且铺满网格', () => {
  for (const v of views) for (const seed of [1, 2, 3]) {
    const m = layoutMosaic(v, seeded(seed));
    const grid = Array.from({ length: m.rows }, () => new Array(m.cols).fill(0));
    for (const t of [m.search, ...m.tiles])
      for (let r = t.r; r < t.r + t.n; r++) for (let c = t.c; c < t.c + t.n; c++) grid[r][c]++;
    assert.ok(grid.every(row => row.every(x => x === 1)), `${v.w}x${v.h} seed ${seed}`);
  }
});

test('搜索格是 3x3 且包含视口中心', () => {
  for (const v of views) {
    const { search } = layoutMosaic(v, seeded(1));
    assert.equal(search.n, 3);
    assert.ok(search.left <= v.w / 2 && v.w / 2 <= search.left + search.size);
    assert.ok(search.top <= v.h / 2 && v.h / 2 <= search.top + search.size);
  }
});

test('格子大小只有 1/2/3，像素尺寸 = n*cell - 4', () => {
  const m = layoutMosaic({ w: 1600, h: 900 }, seeded(9));
  for (const t of m.tiles) {
    assert.ok([1, 2, 3].includes(t.n));
    assert.equal(t.size, t.n * m.cell - 4);
  }
});

test('cell 夹在 72~120', () => {
  assert.equal(layoutMosaic({ w: 600, h: 800 }).cell, 72);
  assert.equal(layoutMosaic({ w: 3000, h: 1500 }).cell, 120);
  assert.equal(layoutMosaic({ w: 1400, h: 900 }).cell, 100);
});

test('歌名位置：左半边的封面歌名靠右，只排在封面露出屏幕的那一段', () => {
  const W = 1000;
  // 左边一半在屏幕外
  assert.deepEqual(captionBox({ left: -40, size: 96 }, W), { left: 40, right: 0, align: 'right', hidden: false });
  // 左半边、完整在屏幕里
  assert.deepEqual(captionBox({ left: 100, size: 96 }, W), { left: 0, right: 0, align: 'right', hidden: false });
  // 右半边，右边一截在屏幕外
  assert.deepEqual(captionBox({ left: 950, size: 96 }, W), { left: 0, right: 46, align: 'left', hidden: false });
  // 右半边、完整在屏幕里
  assert.deepEqual(captionBox({ left: 700, size: 96 }, W), { left: 0, right: 0, align: 'left', hidden: false });
  // 只露出一小截：放不下歌名，不显示
  assert.equal(captionBox({ left: 990, size: 96 }, W).hidden, true);
  assert.equal(captionBox({ left: -70, size: 96 }, W).hidden, true);
});
