// 歌词舞台：入场（从隧道深处飞出）、停住（贴墙、漂浮）、退场（滑向墙、逐字散去）。
// 结构：.line 只管 3D 位置/远近/缩放；.wall 管贴墙倾斜、漂浮、透明度、模糊；每个字一个 span 管弧形弯曲。
// （透明度和 filter 会把 3D 压扁，所以不能放在 .line 上）
import { tune, EXIT_MS, BLUR } from './tune.js';

const easeOut = t => 1 - Math.pow(1 - t, 3);

// 模糊按字号缩放：数值是 64px 大字时定的，手机上字号缩到 28px，固定像素会糊得太重
const blurFor = (line, px) => `blur(${px * BLUR * (parseFloat(getComputedStyle(line).fontSize) || 64) / 64}px)`;

// 一句歌词逐字拆成 span；换行后面是翻译，另起一行、字小一号
function fillLine(wall, text) {
  wall.innerHTML = '';
  text.split('\n').forEach((row, r) => {
    if (r) wall.appendChild(document.createElement('br'));
    for (const ch of row) {
      const sp = document.createElement('span');
      sp.textContent = ch === ' ' ? ' ' : ch;
      if (r) sp.className = 'tr';
      wall.appendChild(sp);
    }
  });
}

export function createStage(el, bg) {
  const vp = bg.vp;

  // 弯曲/倾斜的幅度倍数：从当前值缓动到目标值
  const ampOf = line => {
    const a = line._amp; if (!a) return 1;
    const t = Math.min(1, (performance.now() - a.t0) / a.ms);
    return a.from + (a.to - a.from) * easeOut(t);
  };
  const ampTo = (line, to, ms) => { line._amp = { from: ampOf(line), to, t0: performance.now(), ms }; };

  // 贴墙：按歌词相对隧道中心的方位，每帧重算倾斜和弯曲；再叠上出生时的随机姿态和漂浮
  function fitOne(line) {
    if (!line._spans) return;
    const amp = ampOf(line), t = performance.now() / 1000, ph = line._ph, F = tune.float, b = line._base;
    const fx = Math.sin(t * 0.37 + ph) * F, fy = Math.sin(t * 0.29 + ph * 1.7) * F * 0.6, fz = Math.sin(t * 0.23 + ph * 0.6) * F * 2.5;
    const x = line._x - vp.x, y = line._y - vp.y;
    const cy = Math.max(-1.4, Math.min(1.4, y / (innerHeight * 0.45) + b.cy * tune.curve)) * amp; // 正为向上弯
    const R0 = innerWidth * 1.4;
    line.firstChild.style.transform =
      `translate3d(${fx}px, ${fy}px, ${fz}px) ` +
      `rotateY(${((-x / innerWidth) * 34 + b.ry * tune.curve) * amp + Math.sin(t * 0.31 + ph) * F * 0.15}deg) ` +
      `rotateX(${((y / innerHeight) * 26 + b.rx * tune.curve) * amp}deg)`;
    for (const sp of line._spans) {
      const s = sp._s;
      sp.style.transform = `translateY(${-cy * s * s / (2 * R0)}px) rotate(${Math.atan(-cy * s / R0)}rad)`;
    }
  }

  function show(ly) {
    const line = document.createElement('div'), wall = document.createElement('div');
    line.className = 'line'; wall.className = 'wall';
    fillLine(wall, ly.text);
    line.appendChild(wall);
    wall.style.opacity = 0;
    el.appendChild(line);
    const w = line.offsetWidth;
    line._spans = [...wall.querySelectorAll('span')];
    for (const sp of line._spans) sp._s = sp.offsetLeft + sp.offsetWidth / 2 - w / 2; // 每个字离句中心的距离，只量一次
    line._ly = ly; line._x = ly.x; line._y = ly.y;
    line._ph = Math.random() * 100;
    line._base = {
      cy: (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.2),
      ry: (Math.random() * 2 - 1) * 6,
      rx: (Math.random() * 2 - 1) * 4,
    };
    line._amp = { from: 3, to: 1, t0: performance.now(), ms: tune.dur * 1.1 }; // 从夸张的弧度舒展回来
    fitOne(line);

    const opt = { duration: tune.dur, easing: 'cubic-bezier(.16,.8,.3,1)', fill: 'forwards' };
    line.animate([
      { transform: `translate(${vp.x}px, ${vp.y}px) translateZ(-${tune.dist}px) scale(.7)` }, // 从隧道深处
      { transform: `translate(${ly.x}px, ${ly.y}px) translateZ(0) scale(1)` },
    ], opt);
    wall.animate([
      { opacity: 0, filter: blurFor(line, 14) },
      { opacity: 0.8, offset: 0.6 },
      { opacity: 0.88, filter: blurFor(line, 1.4) }, // 留一点模糊，融进背景
    ], opt);
    const n = line._spans.length, fromRight = ly.x > 0; // 靠屏幕边的那一端先出来
    line._spans.forEach((sp, i) => {
      const k = fromRight ? n - 1 - i : i;
      sp.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: tune.dur * 0.6, delay: (k / Math.max(1, n - 1)) * tune.dur * 0.35, easing: 'ease-out', fill: 'backwards' });
    });
    bg.surge();
  }

  // 退场：从此刻的样子出发，滑向远离隧道中心的墙、往深处退、弯得更厉害、逐字散去
  function defocus(line) {
    if (line._exiting) return;
    line._exiting = true;
    const wall = line.firstChild, D = EXIT_MS;
    for (const a of line.getAnimations({ subtree: true })) { a.commitStyles(); a.cancel(); }
    const x = line._x, y = line._y;
    const ang = Math.atan2(y - vp.y, x - vp.x) || Math.random() * 6.28;
    const ex = x + Math.cos(ang) * innerWidth * 0.18, ey = y + Math.sin(ang) * innerHeight * 0.18;
    line.animate([
      { transform: getComputedStyle(line).transform },
      { transform: `translate(${ex}px, ${ey}px) translateZ(-450px) scale(.9)` },
    ], { duration: D, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = () => line.remove();
    ampTo(line, 2.4, D);
    const spans = line._spans || [], n = spans.length, fromRight = x - vp.x > 0; // 靠墙一端先散
    spans.forEach((sp, i) => {
      const k = fromRight ? n - 1 - i : i;
      sp.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: D * 0.6, delay: (k / Math.max(1, n - 1)) * D * 0.35, easing: 'ease-in', fill: 'forwards' });
    });
    const cs = getComputedStyle(wall);
    wall.animate([
      { opacity: cs.opacity, filter: cs.filter },
      { opacity: 0, filter: blurFor(line, 16) },
    ], { duration: D, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  }

  const lines = () => [...el.children];

  return {
    show,
    fit() { for (const l of lines()) fitOne(l); },
    /** 到点的句子退场：飞完入场且下一句已出现 */
    sweep(time) { for (const l of lines()) if (l._ly && time >= l._ly.exitAt) defocus(l); },
    defocusAll() { for (const l of lines()) defocus(l); },
    clear() { el.innerHTML = ''; },
    /** 量一句歌词的尺寸（不含余量），给落点规划用 */
    measure(text) {
      const m = document.createElement('div'), w = document.createElement('div');
      m.className = 'line'; m.style.visibility = 'hidden';
      fillLine(w, text); m.appendChild(w); el.appendChild(m);
      const size = { w: m.offsetWidth, h: m.offsetHeight };
      m.remove();
      return size;
    },
  };
}
