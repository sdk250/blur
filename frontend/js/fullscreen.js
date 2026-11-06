// 长按播放页背景切换全屏。纯逻辑：定时器与 document 都由调用方传入，便于测试

/**
 * 长按检测：按住 ms 毫秒且移动不超过 slop 像素才触发；触发后吞掉松手时的那次点击。
 */
export function createLongPress(onFire, { ms = 600, slop = 10, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer = null, x0 = 0, y0 = 0, fired = false;
  const cancel = () => { if (timer) clearTimer(timer); timer = null; };
  return {
    down(x, y) {
      cancel(); fired = false; x0 = x; y0 = y;
      timer = setTimer(() => { timer = null; fired = true; onFire(); }, ms);
    },
    move(x, y) { if (timer && Math.hypot(x - x0, y - y0) > slop) cancel(); },
    up: cancel,
    /** 这次点击是否放行 */
    takeClick() { const ok = !fired; fired = false; return ok; },
  };
}

/** 不在全屏就进入，在全屏就退出。浏览器不支持（例如 iPhone 的 Safari）时返回 false。 */
export function toggleFullscreen(doc = document) {
  const el = doc.documentElement;
  const current = doc.fullscreenElement ?? doc.webkitFullscreenElement;
  if (current) {
    const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
    if (!exit) return false;
    Promise.resolve(exit.call(doc)).catch(() => {});
    return true;
  }
  const enter = el.requestFullscreen ?? el.webkitRequestFullscreen;
  if (!enter) return false;
  Promise.resolve(enter.call(el)).catch(() => {});
  return true;
}
