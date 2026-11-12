import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paletteFromPixels, themeFromPixels, toHsl, fromHsl, rgb } from '../js/palette.js';
import { pixels, solid, seeded } from './helpers.js';


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

test('toHsl / fromHsl 往返', () => {
  for (const c of [[0, 0, 0], [255, 255, 255], [200, 40, 40], [30, 120, 60], [17, 99, 230]]) {
    fromHsl(toHsl(c)).forEach((v, i) => assert.ok(Math.abs(v - c[i]) < 1, `${c} -> ${fromHsl(toHsl(c))}`));
  }
});

test('rgb 取整', () => assert.equal(rgb([1.7, 2.2, 3.9]), 'rgb(1,2,3)'));


// ---------- 背景主题：看封面本身的明暗 ----------
const pick = t => ({ dark: t.dark, base: t.base, blend: t.blend });
const L = c => toHsl(c)[2], S = c => toHsl(c)[1], H = c => toHsl(c)[0];

test('封面偏暗 -> 纯黑底 + 叠加发光，色雾是亮色', () => {
  const t = themeFromPixels(solid(30, 30, 45), seeded(1));
  assert.deepEqual(pick(t), { dark: true, base: [0, 0, 0], blend: 'lighter' });
  for (const c of t.mist) {
    assert.ok(L(c) >= 0.55 - 1e-6 && L(c) <= 0.75 + 1e-6, `亮度 ${L(c)}`);
    assert.ok(S(c) >= 0.45 - 1e-6, `饱和度 ${S(c)}`);
  }
});

test('封面偏亮 -> 纯白底 + 正片叠底，色雾是暗色', () => {
  const t = themeFromPixels(solid(235, 225, 205), seeded(2));
  assert.deepEqual(pick(t), { dark: false, base: [255, 255, 255], blend: 'multiply' });
  for (const c of t.mist) assert.ok(L(c) >= 0.2 - 1e-6 && L(c) <= 0.35 + 1e-6, `亮度 ${L(c)}`);
});

test('有颜色的封面：色雾保留封面的色相', () => {
  const t = themeFromPixels(solid(20, 40, 130), seeded(3)); // 深蓝
  for (const c of t.mist) assert.ok(Math.abs(H(c) - H([20, 40, 130])) < 2, `色相 ${H(c)}`);
});

test('灰色封面：色雾随机给色相，不会提亮成一片灰白', () => {
  const t = themeFromPixels(solid(40, 40, 40), seeded(4));
  assert.ok(new Set(t.mist.map(c => Math.round(H(c) / 10))).size >= 2, '色相全一样');
});

test('黑白两档色雾浓度、大小都是用户最早确认的 0.55 / 1 倍', () => {
  for (const px of [solid(30, 30, 45), solid(235, 225, 205)]) {
    const t = themeFromPixels(px, seeded(5));
    assert.equal(t.mistAlpha, 0.55); assert.equal(t.mistRadius, 1);
  }
});

test('歌词与光晕：黑底浅字 L≈0.92、光晕为色雾色；白底深字 L≈0.14、光晕 L≈0.22', () => {
  const d = themeFromPixels(solid(30, 30, 45), seeded(6)), l = themeFromPixels(solid(235, 225, 205), seeded(6));
  assert.ok(Math.abs(L(d.lyric) - 0.92) < 0.01);
  assert.deepEqual(d.glow, d.mist[0]);
  assert.ok(Math.abs(L(l.lyric) - 0.14) < 0.01);
  assert.ok(Math.abs(L(l.glow) - 0.22) < 0.01);
});

test('读不到封面像素：按偏暗处理（黑底 + 亮色雾），不报错', () => {
  const t = themeFromPixels(null, seeded(7));
  assert.equal(t.dark, true);
  assert.equal(t.mist.length, 5);
});

test('手动指定黑底/白底：不看封面明暗，配色跟着那一档走', () => {
  const w = themeFromPixels(solid(30, 30, 45), seeded(7), { dark: false });
  assert.deepEqual(pick(w), { dark: false, base: [255, 255, 255], blend: 'multiply' });
  for (const c of w.mist) assert.ok(L(c) <= 0.35 + 1e-6);
  const b = themeFromPixels(solid(235, 225, 205), seeded(7), { dark: true });
  assert.deepEqual(pick(b), { dark: true, base: [0, 0, 0], blend: 'lighter' });
});
