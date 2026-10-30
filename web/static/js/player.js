// 播放器：一首歌的状态、每帧驱动（背景 + 歌词）、音量淡入淡出、空格、闲置隐藏、左下角歌名
import { tune, IDLE_MS, FADE_TOGGLE_MS } from './tune.js';
import { themeFromPixels, rgb } from './palette.js';
import { toLines, schedule, planPositions, lineAt } from './lyrics-plan.js';
import { createRevealGuard } from './reveal-guard.js';
import { pageTitle } from './page-title.js';

// 读封面像素（48x48）；跨域被污染、图没加载好时返回 null，取色会退回默认色
function coverPixels(img) {
  try {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, 48, 48);
    return g.getImageData(0, 0, 48, 48).data;
  } catch {
    return null;
  }
}

export function createPlayer({ playerEl, titleEl, audio, stage, bg }) {
  let lines = [], idx = -1, active = false, playing = false, fadeId = 0, song = null;
  const syncTitle = () => { document.title = pageTitle(song, lines, idx); };
  const prevBtn = titleEl.querySelector('.prev');

  // ---------- 每帧 ----------
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!active) return;
    bg.step(dt);
    stage.fit();
    if (!lines.length) return;
    const t = audio.currentTime;
    const i = lineAt(lines, t);
    if (i !== idx) {
      if (i < idx || i > idx + 1) stage.defocusAll(); // 跳跃（重新开始）时场上的全部退场
      idx = i;
      if (i >= 0) stage.show(lines[i]);
      syncTitle();
    }
    stage.sweep(t);
    // 隧道中心始终瞄准“提前 lead 秒”时的那一句，追不上没关系
    const j = lineAt(lines, t + tune.lead);
    if (j >= 0) { bg.focus.x = lines[j].x; bg.focus.y = lines[j].y; }
  }
  requestAnimationFrame(frame);

  // ---------- 音量淡入淡出：从当前音量缓到目标，连按时接着当前音量继续 ----------
  function fadeVolume(to, ms) {
    const id = ++fadeId, v0 = audio.volume, t0 = performance.now();
    return new Promise(done => {
      const stepVol = () => {
        if (id !== fadeId) return done(false);
        const k = Math.min(1, (performance.now() - t0) / ms);
        audio.volume = v0 + (to - v0) * k;
        k < 1 ? requestAnimationFrame(stepVol) : done(true);
      };
      stepVol();
    });
  }
  // 播放/暂停按钮显示哪个符号
  const syncIcon = () => titleEl.classList.toggle('is-playing', playing);

  async function fadePlay(ms) {
    playing = true; syncIcon();
    if (audio.paused) {
      audio.volume = 0;
      try { await audio.play(); } catch (e) { playing = false; syncIcon(); throw e; }
    }
    fadeVolume(1, ms);
  }
  async function fadePause(ms) {
    playing = false; syncIcon();
    if (await fadeVolume(0, ms)) audio.pause();
  }

  // 空格和播放/暂停按钮共用
  function toggle() {
    return playing ? fadePause(FADE_TOGGLE_MS) : fadePlay(FADE_TOGGLE_MS).catch(() => {});
  }

  // ---------- 空格 ----------
  addEventListener('keydown', e => {
    if (e.code !== 'Space' || !active || self.busy) return; // 转场进行中不响应
    e.preventDefault();
    toggle();
  });

  // ---------- 闲置隐藏：鼠标停在歌名/按钮上时不隐藏，否则淡出中的按钮会吞掉一次点击 ----------
  let idleTimer;
  function wake() {
    playerEl.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function hide() {
      if (titleEl.matches(':hover') && matchMedia('(hover: hover)').matches) { idleTimer = setTimeout(hide, 500); return; }
      playerEl.classList.add('idle');
      titleEl.classList.remove('open');
    }, IDLE_MS);
  }
  for (const ev of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, wake, { passive: true });

  // 触屏：第一下点歌名只展开按钮，不触发按钮；点别处收起
  const guard = createRevealGuard();
  titleEl.addEventListener('pointerdown', e => {
    const wasOpen = titleEl.classList.contains('open');
    guard.pointerDown(e.pointerType, wasOpen);
    if (e.pointerType !== 'mouse') titleEl.classList.add('open');
  });
  titleEl.addEventListener('click', e => { if (!guard.takeClick()) e.stopPropagation(); }, true); // 捕获阶段，先于按钮
  addEventListener('pointerdown', e => { if (!titleEl.contains(e.target)) titleEl.classList.remove('open'); });

  // ---------- 一首歌 ----------
  function applyCover(img) {
    const theme = themeFromPixels(coverPixels(img));
    bg.setTheme(theme);
    document.body.classList.toggle('light', !theme.dark);
    playerEl.style.setProperty('--lyric', rgb(theme.lyric));
    const g = theme.glow;
    playerEl.style.setProperty('--glow', `rgba(${g[0] | 0},${g[1] | 0},${g[2] | 0},.45)`);
  }

  const self = {
    busy: false, // 转场进行中由转场模块置为 true
    get playing() { return playing; },
    get active() { return active; },
    fadePlay, fadePause, toggle,

    /** 在封面挡着屏幕时调用：取色、规划歌词、换歌名、换音源（不自动播放） */
    start(next, coverImg) {
      song = next;
      stage.clear(); idx = -1;
      bg.reset();
      applyCover(coverImg);
      active = true;
      playerEl.classList.add('on');
      lines = toLines(song.lyric);
      schedule(lines);
      planPositions(lines, text => stage.measure(text), { w: innerWidth, h: innerHeight });
      titleEl.querySelector('.name').textContent = `${song.name} · ${song.art.join(' / ')}`;
      syncTitle();
      wake();
      audio.src = song.data;
    },

    stop() {
      fadeId++; playing = false; syncIcon();
      audio.pause(); audio.removeAttribute('src'); audio.load();
      active = false;
      playerEl.classList.remove('on');
      stage.clear(); lines = []; idx = -1;
      document.body.classList.remove('light');
      song = null; syncTitle();
    },

    /** 切歌开始：歌词全部退场、不再出新句；失败时 resumeLyrics 恢复原来那首已规划好的歌词 */
    suspendLyrics() { const saved = lines; lines = []; stage.defocusAll(); return saved; },
    resumeLyrics(saved) { lines = saved; idx = -1; },

    onEnded(fn) { audio.addEventListener('ended', fn); },
    setPrevEnabled(on) { prevBtn.classList.toggle('off', !on); },
  };
  return self;
}
