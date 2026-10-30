// 启动与组装
import { fetchTop } from './api.js';
import { createBackground } from './background.js';
import { createStage } from './lyrics-stage.js';
import { createPlayer } from './player.js';
import { buildMosaic } from './mosaic.js';
import { createTransitions } from './transition.js';
import { Navigator } from './navigation.js';

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
player.onEnded(() => tr.switchTo('next')); // 播完自动下一曲

const build = songs => { mosaic = buildMosaic(home, songs, { onPick: tr.enter, toast }); };

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
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (!tr.busy && !player.active) build(songs); }, 300);
  });
})();
