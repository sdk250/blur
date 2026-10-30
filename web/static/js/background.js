// 背景：纯黑/纯白底上，一团团色雾从“隧道中心”深处涌出（只靠运动营造穿梭感，没有任何线条）。
// 隧道中心用欠阻尼弹簧追 focus（由播放器按“提前 lead 秒”的歌词位置设置）。
import { tune, MIST_LIFE, MIST_COUNT, BG_BLUR, BLUR } from './tune.js';
import { rgb } from './palette.js';

const SCALE = 0.25; // 低分辨率绘制，反正要被模糊

export function createBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = innerWidth * 1.2 * SCALE; canvas.height = innerHeight * 1.2 * SCALE;
    // 模糊随屏幕缩放：手机屏小，同样的像素会糊得更重
    canvas.style.filter = `blur(${BG_BLUR * BLUR * Math.min(1, Math.max(innerWidth, innerHeight) / 1440)}px)`;
  };
  addEventListener('resize', resize); resize();

  let palette = [[120, 100, 150], [90, 95, 135], [140, 105, 130], [85, 110, 140], [110, 90, 120]];
  let base = [0, 0, 0], blend = 'lighter', boost = 0;
  const focus = { x: 0, y: 0 };            // 目标（屏幕中心为原点的像素）
  const vp = { x: 0, y: 0, vx: 0, vy: 0 }; // 隧道中心
  const blobs = Array.from({ length: MIST_COUNT }, (_, i) => ({ p: i / MIST_COUNT, a: Math.random() * Math.PI * 2, ci: i % 5 }));

  function step(dt) {
    const W = canvas.width, H = canvas.height, M = Math.max(W, H);
    boost *= Math.exp(-1.2 * dt);
    const STIFF = tune.chase ** 2, DAMP = tune.chase * 1.3;
    vp.vx += ((focus.x - vp.x) * STIFF - vp.vx * DAMP) * dt; vp.x += vp.vx * dt;
    vp.vy += ((focus.y - vp.y) * STIFF - vp.vy * DAMP) * dt; vp.y += vp.vy * dt;
    const vx = W / 2 + vp.x * SCALE, vy = H / 2 + vp.y * SCALE;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgb(base); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = blend;
    // 深度 z 处的中心：远处在隧道中心，近处回到屏幕中心，于是隧道“弯”向焦点
    const center = z => [W / 2 + (vx - W / 2) * z, H / 2 + (vy - H / 2) * z];
    for (const b of blobs) {
      b.p += dt / MIST_LIFE * (1 + boost);
      if (b.p >= 1) { b.p -= 1; b.a = Math.random() * Math.PI * 2; }
      const p = b.p, z = 1 - p * 0.88, ang = b.a + p * 1.6; // 边飘边转
      const [ox, oy] = center(z);
      const d = M * 0.09 / z;                                // 透视：越近散得越快
      const x = ox + Math.cos(ang) * d, y = oy + Math.sin(ang) * d * 0.8;
      const R = M * 0.06 / z;                                // 越近越大
      ctx.globalAlpha = Math.sin(Math.PI * p) * 0.55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, rgb(palette[b.ci])); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return {
    focus, vp, step,
    /** 换一首歌：颜色直接到位（封面正挡着屏幕，不需要渐变） */
    setTheme(theme, colors) { base = theme.base.slice(); blend = theme.blend; palette = colors.map(c => c.slice()); },
    surge() { boost = 0.6; }, // 新歌词到来时往前带一下
    reset() { Object.assign(focus, { x: 0, y: 0 }); Object.assign(vp, { x: 0, y: 0, vx: 0, vy: 0 }); },
  };
}
