// 测试用的小工具：可复现的随机数、像素数组
export function seeded(seed = 1) { // mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pixels(fn, N = 48) {
  const d = new Uint8ClampedArray(N * N * 4);
  for (let i = 0; i < N * N; i++) { const [r, g, b] = fn(i, N); d.set([r, g, b, 255], i * 4); }
  return d;
}
export const solid = (r, g, b) => pixels(() => [r, g, b]);
