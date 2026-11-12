// 首页拼图布局：铺满视口的网格，正中 3x3 是搜索格，其余随机 1x1 / 2x2 / 偶尔 3x3。纯函数

const GAP = 4;

/**
 * @returns {{ cell, cols, rows, search: Rect, tiles: Rect[] }}
 *   tiles 按离屏幕中心由近到远排：歌按热度依次填进去，最火的在中间
 *   opts.lead：大于 0 时第一个格子固定为 lead x lead，随机放在紧贴搜索格、完整露在屏幕里的位置（没有就放离中心最近处）
 *   Rect = { r, c, n, left, top, size }：r/c/n 是网格坐标与边长（格数），left/top/size 是屏幕像素（已扣间距）
 */
export function layoutMosaic(view, rand = Math.random, { lead = 0 } = {}) {
  const cell = Math.max(72, Math.min(120, view.w / 14));
  const cols = Math.ceil(view.w / cell) + 1, rows = Math.ceil(view.h / cell) + 1;
  const ox = (cols * cell - view.w) / 2, oy = (rows * cell - view.h) / 2; // 整体居中
  const used = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const fits = (r, c, n) => r + n <= rows && c + n <= cols &&
    used.slice(r, r + n).every(row => row.slice(c, c + n).every(v => !v));
  const take = (r, c, n) => { for (let i = r; i < r + n; i++) for (let j = c; j < c + n; j++) used[i][j] = true; };
  const rect = (r, c, n) => ({ r, c, n, left: c * cell - ox + GAP / 2, top: r * cell - oy + GAP / 2, size: n * cell - GAP });

  const clamp = (v, hi) => Math.max(0, Math.min(hi, v));
  const sr = clamp(Math.round((view.h / 2 + oy) / cell - 1.5), rows - 3);
  const sc = clamp(Math.round((view.w / 2 + ox) / cell - 1.5), cols - 3);
  take(sr, sc, 3);
  const search = rect(sr, sc, 3);

  const center = (r, c, n) => Math.hypot((c + n / 2) * cell - ox - view.w / 2, (r + n / 2) * cell - oy - view.h / 2);
  const visible = (r, c, n) => { const x = rect(r, c, n); return x.left >= 0 && x.top >= 0 && x.left + x.size <= view.w && x.top + x.size <= view.h; };
  // 和搜索格共用一段边（不算只碰到角）
  const touches = (r, c, n) => (r + n === sr || r === sr + 3) ? c < sc + 3 && c + n > sc
    : (c + n === sc || c === sc + 3) && r < sr + 3 && r + n > sr;
  let first = null;
  for (let n = lead; n > 0 && !first; n--) {
    const near = [];
    let best = null;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!fits(r, c, n)) continue;
      if (touches(r, c, n) && visible(r, c, n)) near.push({ r, c });
      const d = center(r, c, n);
      if (!best || d < best.d) best = { r, c, d };
    }
    const at = near.length ? near[Math.floor(rand() * near.length)] : best;
    if (at) { take(at.r, at.c, n); first = rect(at.r, at.c, n); }
  }

  const tiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (used[r][c]) continue;
    const roll = rand();
    let n = roll < 0.06 ? 3 : roll < 0.3 ? 2 : 1;
    while (n > 1 && !fits(r, c, n)) n--;
    take(r, c, n);
    tiles.push(rect(r, c, n));
  }
  const dist = t => Math.hypot(t.left + t.size / 2 - view.w / 2, t.top + t.size / 2 - view.h / 2);
  tiles.sort((a, b) => dist(a) - dist(b));
  if (first) tiles.unshift(first);
  return { cell, cols, rows, search, tiles };
}

/**
 * 封面上的歌名怎么排：拼图比屏幕宽，最边上的封面有一截在屏幕外。
 * 左半边的封面歌名靠右；只排在封面露出屏幕的那一段（left / right 是两边要让出的像素）。
 * 露出不到 MIN_CAPTION 像素时放不下歌名，hidden 为 true。
 */
const MIN_CAPTION = 40;
export function captionBox(rect, viewW) {
  const left = Math.max(0, -rect.left), right = Math.max(0, rect.left + rect.size - viewW);
  return {
    left, right,
    align: rect.left + rect.size / 2 < viewW / 2 ? 'right' : 'left',
    hidden: rect.size - left - right < MIN_CAPTION,
  };
}
