import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paletteFromPixels, coverTheme, toHsl, fromHsl, rgb } from '../js/palette.js';
import { pixels, solid } from './helpers.js';

const fill = c => Array.from({ length: 5 }, () => c.slice());
const pick = t => ({ dark: t.dark, base: t.base, blend: t.blend });

test('跳过接近纯白的像素', () => {
  const cols = paletteFromPixels(pixels(i => (i % 2 ? [255, 255, 255] : [200, 40, 40])));
  assert.equal(cols.length, 5);
  for (const c of cols) assert.ok(c[0] > c[1] + 50, `不是红系: ${c}`);
});

test('不足 5 类时循环补齐', () => assert.equal(paletteFromPixels(solid(30, 120, 60)).length, 5));

test('读不到像素时用默认色', () => {
  assert.deepEqual(paletteFromPixels(null)[0], [120, 100, 150]);
  assert.equal(paletteFromPixels(null).length, 5);
});

test('色雾亮度夹在 [0.2, 0.8]', () => {
  for (const c of [...paletteFromPixels(solid(5, 5, 5)), ...paletteFromPixels(solid(250, 248, 200))]) {
    const l = toHsl(c)[2];
    assert.ok(l >= 0.2 - 1e-6 && l <= 0.8 + 1e-6, `亮度越界: ${l}`);
  }
});

test('平均亮度 > 0.5 选黑底 + lighter，否则白底 + multiply', () => {
  assert.deepEqual(pick(coverTheme(fill([230, 200, 220]))), { dark: true, base: [0, 0, 0], blend: 'lighter' });
  assert.deepEqual(pick(coverTheme(fill([60, 40, 50]))), { dark: false, base: [255, 255, 255], blend: 'multiply' });
});

test('歌词色：黑底 L≈0.92，白底 L≈0.14；光晕黑底为色雾本色、白底 L≈0.22', () => {
  const darkT = coverTheme(fill([230, 200, 220])), lightT = coverTheme(fill([60, 40, 50]));
  assert.ok(Math.abs(toHsl(darkT.lyric)[2] - 0.92) < 0.01);
  assert.ok(Math.abs(toHsl(lightT.lyric)[2] - 0.14) < 0.01);
  assert.deepEqual(darkT.glow, [230, 200, 220]);
  assert.ok(Math.abs(toHsl(lightT.glow)[2] - 0.22) < 0.01);
});

test('toHsl / fromHsl 往返', () => {
  for (const c of [[0, 0, 0], [255, 255, 255], [200, 40, 40], [30, 120, 60], [17, 99, 230]]) {
    fromHsl(toHsl(c)).forEach((v, i) => assert.ok(Math.abs(v - c[i]) < 1, `${c} -> ${fromHsl(toHsl(c))}`));
  }
});

test('rgb 取整', () => assert.equal(rgb([1.7, 2.2, 3.9]), 'rgb(1,2,3)'));

const lumOf = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

test('白底：色雾压暗（亮度 ≤ 0.30）、更浓更大，画面不发白', () => {
  const t = coverTheme([[60, 40, 50], [180, 150, 160], [90, 120, 80], [200, 200, 190], [70, 70, 90]]);
  assert.equal(t.dark, false);
  for (const c of t.mist) assert.ok(lumOf(c) <= 0.30 + 1e-6, `色雾太亮: ${c}`);
  assert.equal(t.mistAlpha, 1.0);
  assert.equal(t.mistRadius, 1.8);
});

test('白底压暗时保留色相', () => {
  const t = coverTheme([[200, 120, 120], [200, 120, 120], [60, 40, 50], [60, 40, 50], [60, 40, 50]]);
  assert.ok(Math.abs(toHsl(t.mist[0])[0] - toHsl([200, 120, 120])[0]) < 1);
});

test('黑底保持原样：色雾不变、浓度 0.55、大小 1 倍', () => {
  const cols = fill([230, 200, 220]);
  const t = coverTheme(cols);
  assert.equal(t.dark, true);
  assert.deepEqual(t.mist, cols);
  assert.equal(t.mistAlpha, 0.55);
  assert.equal(t.mistRadius, 1);
});
