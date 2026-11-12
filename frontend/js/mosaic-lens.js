// 首页拼图的“放大镜”：鼠标周围一圈封面一起放大，越远越小；鼠标正落在的那张再大一些。纯函数
// 放大量按像素算（长出 n 像素），所以 2x2、3x3 的大格子不会被放得太夸张

/**
 * rects: [{ left, top, size }]（没有缩放时的位置），p: 鼠标 { x, y } 或 null
 * opt: { radius 影响半径 px, grow 周围最多长出的像素, hitGrow 命中的那张额外长出的像素 }
 * @returns [{ scale, hit, z }]，z 越大越靠上
 */
export function lensFor(rects, p, { radius, grow, hitGrow }) {
  return rects.map(r => {
    if (!p) return { scale: 1, hit: false, z: 0 };
    // 到格子边缘的距离（在格子里面是 0）：大格子靠近边缘就开始放大
    const dx = Math.max(r.left - p.x, 0, p.x - (r.left + r.size));
    const dy = Math.max(r.top - p.y, 0, p.y - (r.top + r.size));
    const hit = dx === 0 && dy === 0;
    let f = Math.exp(-((dx * dx + dy * dy) / (radius * radius)));
    if (f < 0.02) f = 0; // 远处的完全不动
    const px = grow * f + (hit ? hitGrow : 0);
    return { scale: 1 + px / r.size, hit, z: hit ? 100 : Math.round(f * 50) };
  });
}

/** 接到首页上：只响应鼠标（触屏没有悬停）。reset() 让所有封面复原，比如进入播放页时 */
export function attachLens(homeEl, opt) {
  let p = null, raf = 0;
  const apply = () => {
    raf = 0;
    // 搜索格只有搜到歌以后才算一张封面
    const tiles = [...homeEl.querySelectorAll('.tile:not(.search), .tile.search.found')];
    const rects = tiles.map(t => ({ left: parseFloat(t.style.left), top: parseFloat(t.style.top), size: parseFloat(t.style.width) }));
    lensFor(rects, p, opt).forEach((o, i) => {
      const t = tiles[i];
      t.style.transform = o.scale === 1 ? '' : `scale(${o.scale.toFixed(4)})`;
      t.style.zIndex = o.z ? String(o.z) : '';
      t.classList.toggle('hit', o.hit);
    });
  };
  const update = () => { if (!raf) raf = requestAnimationFrame(apply); };
  homeEl.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    p = { x: e.clientX, y: e.clientY }; // 首页铺满视口，格子的 left/top 就是屏幕坐标
    update();
  });
  homeEl.addEventListener('pointerleave', () => { p = null; update(); });
  return { reset() { p = null; cancelAnimationFrame(raf); apply(); } };
}
