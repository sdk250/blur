// 封面取色：纯函数，不碰 DOM（读像素在调用方做）
import { MIST } from './tune.js';

const DEFAULT = [[120, 100, 150], [90, 95, 135], [140, 105, 130], [85, 110, 140], [110, 90, 120]];

export const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

export function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return [h, s, l];
}

export function fromHsl([h, s, l]) {
  h = ((h % 360) + 360) % 360;
  const C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs((h / 60) % 2 - 1)), m = l - C / 2;
  const [r, g, b] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const sat = c => { const mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
const lum = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

// 色雾色：保留明暗，只提一点饱和度，再避开纯黑纯白
function mistColor(c) {
  const [h, s, l] = toHsl(c);
  return fromHsl([h, Math.min(0.85, s * 1.4 + 0.1), Math.min(0.8, Math.max(0.2, l))]);
}

/**
 * 从 48x48 封面像素（RGBA）取 5 个色雾色。
 * 跳过接近纯白的像素（白边、白天空），k-means 聚 10 类，偏向“有颜色”的类。
 * data 为 null（读不到像素）时返回默认紫灰色。
 */
export function paletteFromPixels(data) {
  if (!data || !data.length) return DEFAULT.map(c => c.slice());
  let px = [];
  for (let i = 0; i < data.length; i += 4) {
    const p = [data[i], data[i + 1], data[i + 2]], mx = Math.max(...p), mn = Math.min(...p);
    if (mn > 225 && mx - mn < 20) continue;
    px.push(p);
  }
  if (px.length < 64) {
    px = [];
    for (let i = 0; i < data.length; i += 4) px.push([data[i], data[i + 1], data[i + 2]]);
  }
  const K = 10;
  let cents = Array.from({ length: K }, (_, i) => px[(i * px.length / K) | 0].slice());
  const assign = new Array(px.length).fill(0);
  for (let it = 0; it < 12; it++) {
    const sum = cents.map(() => [0, 0, 0, 0]);
    px.forEach((p, n) => {
      let best = 0, bd = Infinity;
      cents.forEach((c, k) => {
        const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dd < bd) { bd = dd; best = k; }
      });
      assign[n] = best;
      const s = sum[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    });
    cents = cents.map((c, k) => sum[k][3] ? sum[k].slice(0, 3).map(v => v / sum[k][3]) : c);
  }
  const count = cents.map((_, k) => assign.filter(a => a === k).length / px.length);
  const ranked = cents
    .map((c, k) => ({ c, w: count[k], score: Math.sqrt(count[k]) * (0.1 + sat(c)) ** 1.5 }))
    .filter(x => x.w > 0.005)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.c);
  return Array.from({ length: 5 }, (_, i) => mistColor(ranked[i % ranked.length]));
}

// 封面整体亮度（所有像素，含白边）：决定黑底还是白底
function coverLum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += lum([data[i], data[i + 1], data[i + 2]]);
  return sum / (data.length / 4);
}

/**
 * 背景主题，看封面本身的明暗（用户定的规则）：
 *   封面偏暗 -> 纯黑底 + 叠加发光，色雾取封面色相、随机提成亮色，歌词浅色
 *   封面偏亮 -> 纯白底 + 正片叠底，色雾取封面色相、随机压成暗色，歌词深色
 * 几乎是灰色的颜色没有可用的色相，随机给一个，否则提亮后是一片灰白。
 * data 为 null（读不到封面）时按偏暗处理。opt.dark 给了就不看封面明暗（用户手动切黑白底）。
 */
export function themeFromPixels(data, rand = Math.random, opt = {}) {
  const dark = opt.dark ?? (!data || !data.length || coverLum(data) <= 0.5);
  const mist = paletteFromPixels(data).map(c => {
    const [h0, s0] = toHsl(c);
    const h = s0 < 0.15 ? rand() * 360 : h0;
    const s = Math.max(0.45, Math.min(0.85, s0));
    const l = dark ? 0.55 + rand() * 0.2 : 0.2 + rand() * 0.15;
    return fromHsl([h, s, l]);
  });
  const [h, s] = toHsl(mist[0]);
  return {
    dark,
    base: dark ? [0, 0, 0] : [255, 255, 255],
    blend: dark ? 'lighter' : 'multiply',
    mist,
    mistAlpha: MIST.alpha,
    mistRadius: MIST.radius,
    lyric: fromHsl([h, 0.3, dark ? 0.92 : 0.14]),
    glow: dark ? mist[0].slice() : fromHsl([h, s, 0.22]),
  };
}
