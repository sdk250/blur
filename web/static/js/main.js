// 启动与组装
import { fetchTop } from './api.js';
import { createBackground } from './background.js';
import { createStage } from './lyrics-stage.js';
import { createPlayer } from './player.js';
import { buildMosaic } from './mosaic.js';
import { createTransitions } from './transition.js';
import { Navigator } from './navigation.js';
import { shouldRebuild } from './resize-policy.js';
import { createLongPress, toggleFullscreen } from './fullscreen.js';

const $ = id => document.getElementById(id);
const home = $('home'), playerEl = $('player'), titleEl = $('title');

function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2500);
}

const bg = createBackground($('bg'));
const stage = createStage($('stage'), bg);
const player = createPlayer({ playerEl, titleEl, audio: $('audio'), stage, bg });
const nav = new Navigator([]);
let mosaic = null;
const tr = createTransitions({ home, player, nav, mosaic: () => mosaic, toast });

titleEl.querySelector('.back').onclick = () => tr.leave();
titleEl.querySelector('.prev').onclick = () => tr.switchTo('prev');
titleEl.querySelector('.next').onclick = () => tr.switchTo('next');
titleEl.querySelector('.pp').onclick = () => { if (!tr.busy) player.toggle(); };
titleEl.querySelector('.split').onclick = () => { if (!tr.busy) player.setSplit(!player.split); };
player.onEnded(() => tr.switchTo('next')); // 播完自动下一曲

// 长按播放页背景（歌名那一块除外）：进入 / 退出全屏
const longPress = createLongPress(() => {
  if (!toggleFullscreen()) toast('这个浏览器不支持全屏');
});
playerEl.addEventListener('pointerdown', e => {
  if (player.active && !tr.busy && !titleEl.contains(e.target)) longPress.down(e.clientX, e.clientY);
});
playerEl.addEventListener('pointermove', e => longPress.move(e.clientX, e.clientY));
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) playerEl.addEventListener(ev, () => longPress.up());
playerEl.addEventListener('click', e => { if (!longPress.takeClick()) e.stopPropagation(); }, true);
playerEl.addEventListener('contextmenu', e => e.preventDefault()); // 手机长按不弹系统菜单

// 首次构建播浮现动画；之后的重建沿用搜索格、不播动画
const build = songs => {
  mosaic = buildMosaic(home, songs, { onPick: tr.enter, toast, searchTile: mosaic?.searchTile, animate: !mosaic });
};

(async () => {
  let songs;
  try {
    songs = await fetchTop(100);
  } catch {
    home.innerHTML = '<p style="text-align:center;margin-top:40vh;opacity:.6">连不上后端</p>';
    return;
  }
  nav.pool = songs; // 随机下一曲的候选 = 拼图里的歌
  build(songs);
  let rt, size = { w: innerWidth, h: innerHeight };
  const typing = () => document.activeElement?.tagName === 'INPUT';
  const relayout = () => {
    const now = { w: innerWidth, h: innerHeight };
    if (tr.busy || player.active || !shouldRebuild(size, now, typing())) return;
    size = now;
    build(songs);
  };
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 300); });
  // 收起键盘后（输入框失焦）补一次：期间被跳过的尺寸变化在这里追上
  home.addEventListener('focusout', () => { clearTimeout(rt); rt = setTimeout(relayout, 300); });
})();
