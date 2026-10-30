// 封面取色：纯函数，不碰 DOM（读像素在调用方做）
import { LIGHT_MIST, DARK_MIST } from './tune.js';

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

/**
 * 由色雾色决定整体主题：色雾整体偏亮 -> 纯黑底 + 叠加发光；偏暗 -> 纯白底 + 正片叠底。
 * 歌词与光晕取第一个色雾色的色相。
 * 白底时色雾按比例压暗（保留色相）、加浓加大，否则大片白底露出来，整个画面发白。
 */
export function coverTheme(colors) {
  const dark = colors.reduce((a, c) => a + lum(c), 0) / colors.length > 0.5;
  const [h, s] = toHsl(colors[0]);
  const darken = c => { const k = Math.min(1, LIGHT_MIST.maxLum / Math.max(lum(c), 1e-6)); return c.map(v => v * k); };
  return {
    dark,
    mist: dark ? colors.map(c => c.slice()) : colors.map(darken),
    mistAlpha: dark ? DARK_MIST.alpha : LIGHT_MIST.alpha,
    mistRadius: dark ? DARK_MIST.radius : LIGHT_MIST.radius,
    base: dark ? [0, 0, 0] : [255, 255, 255],
    blend: dark ? 'lighter' : 'multiply',
    lyric: fromHsl([h, 0.3, dark ? 0.92 : 0.14]),
    glow: dark ? colors[0].slice() : fromHsl([h, s, 0.22]),
  };
}
