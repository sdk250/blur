// 首页拼图：大小不一的封面墙，正中是搜索格。点封面 -> onPick(格子, 取歌函数, 已知的歌名/歌手/封面)
import { layoutMosaic } from './mosaic-layout.js';
import { smallCover, fetchSong, searchSong } from './api.js';

function loadImg(img, src) {
  img.crossOrigin = 'anonymous'; // 取色要读像素
  img.onload = () => img.classList.add('ok');
  img.src = src;
}

function place(el, rect) {
  Object.assign(el.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.size}px`, height: `${rect.size}px` });
}

function makeSearchTile(onPick, toast) {
  const t = document.createElement('div');
  t.className = 'tile search';
  t.innerHTML = `<img alt=""><div class="hint">搜 索</div><div class="who"></div>
    <form><input placeholder="歌名 / 歌手，回车" autocomplete="off"></form>`;
  const img = t.querySelector('img'), input = t.querySelector('input'), who = t.querySelector('.who');
  let found = null;

  const show = song => {
    found = song;
    img.classList.remove('ok');
    loadImg(img, smallCover(song.picture));
    t.classList.add('found');
    who.textContent = `${song.name} · ${song.art.join(' / ')}`;
  };

  t.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const key = input.value.trim(); if (!key) return;
    who.textContent = '搜索中…'; input.blur();
    try {
      show(await searchSong(key));
    } catch (err) {
      found = null; t.classList.remove('found'); img.classList.remove('ok');
      who.textContent = ''; toast(`没有搜到：${err.message}`);
    }
  };
  // 点封面（不是点输入框）就进入；重新取一次，搜索时拿到的链接可能已经过期
  t.onclick = e => { if (found && !e.target.closest('form')) onPick(t, () => fetchSong(found.id), found); };
  t.show = show; // 返回时当前歌不在拼图里，就让搜索格变成它
  return t;
}

/**
 * opts.searchTile：重建时传入原来的搜索格，保留输入内容和搜索结果
 * opts.animate：首次打开才播从中心浮现的动画，重建时不播（否则看起来像刷新了页面）
 * @returns {{ tileOf: Map<id, HTMLElement>, searchTile: HTMLElement }}
 *   tileOf：每首歌第一次出现的格子（返回时替身缩回这里）
 */
export function buildMosaic(homeEl, songs, { onPick, toast, searchTile: keep = null, animate = true }) {
  homeEl.innerHTML = '';
  const view = { w: innerWidth, h: innerHeight };
  const layout = layoutMosaic(view);
  const tileOf = new Map();

  const searchTile = keep || makeSearchTile(onPick, toast);
  place(searchTile, layout.search);
  const all = [searchTile];

  layout.tiles.forEach((rect, k) => {
    const song = songs[k % songs.length];
    if (!song) return;
    const t = document.createElement('div');
    t.className = 'tile';
    t.innerHTML = '<img alt=""><div class="cap"></div>';
    t.querySelector('.cap').textContent = `${song.name} · ${song.art.join(' / ')}`;
    loadImg(t.querySelector('img'), smallCover(song.picture));
    t.onclick = () => onPick(t, () => fetchSong(song.id), song);
    if (!tileOf.has(song.id)) tileOf.set(song.id, t);
    place(t, rect);
    all.push(t);
  });

  // 从中间向外一圈圈浮现
  const cx = view.w / 2, cy = view.h / 2;
  for (const t of all) {
    const l = parseFloat(t.style.left), tp = parseFloat(t.style.top), s = parseFloat(t.style.width);
    const d = Math.hypot(l + s / 2 - cx, tp + s / 2 - cy);
    if (animate) t.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }],
      { duration: 700, delay: d * 0.9, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
    homeEl.appendChild(t);
  }
  return { tileOf, searchTile };
}
