// 三个转场，共用一个 busy 锁（进行中按钮和空格都不响应）：
//   进入：封面放大铺满 -> 化开成色雾
//   返回：色雾凝回封面 -> 缩回拼图里当前这首的格子
//   切歌：歌词退场 -> 新封面从色雾凝出 -> 再化开（不回拼图）
import { FADE_IN_MS, FADE_OUT_MS } from './tune.js';
import { smallCover, fetchSong } from './api.js';

const square = () => {
  const S = Math.max(innerWidth, innerHeight);
  return { left: (innerWidth - S) / 2, top: (innerHeight - S) / 2, width: S, height: S };
};
const box = r => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
// 格子在首页里绝对定位、首页铺满视口，所以 style 就是它在屏幕上的位置（首页缩小时也不受影响）
const rectOf = t => ({ left: parseFloat(t.style.left), top: parseFloat(t.style.top), width: parseFloat(t.style.width), height: parseFloat(t.style.height) });

// 页面在后台（锁屏、切走）时动画不走，等它结束会卡住切歌：后台建的动画直接跳到结尾，切到后台时正在放的也跳到结尾
const run = (el, keyframes, opts) => { const a = el.animate(keyframes, opts); if (document.hidden) a.finish(); return a; };
document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.querySelectorAll('#ghost').forEach(g => g.getAnimations().forEach(a => a.finish()));
});

function makeGhost(src, rect, extra = {}) {
  const g = document.createElement('img');
  g.id = 'ghost'; g.crossOrigin = 'anonymous'; g.src = src;
  Object.assign(g.style, box(rect), extra);
  document.body.appendChild(g);
  return g;
}

// 化开：越来越糊、略微放大、淡掉，下面的色雾露出来
const dissolve = g => run(g, [
  { filter: 'blur(0px)', opacity: 1, transform: 'scale(1)' },
  { filter: 'blur(30px)', opacity: 0.85, offset: 0.4 },
  { filter: 'blur(70px)', opacity: 0, transform: 'scale(1.15)' },
], { duration: 1800, easing: 'ease-in-out', fill: 'forwards' }).finished;

// 凝出：反过来，从一团雾变回清晰封面
const condense = g => run(g, [
  { filter: 'blur(70px)', opacity: 0, transform: 'scale(1.15)' },
  { filter: 'blur(0px)', opacity: 1, transform: 'scale(1)' },
], { duration: 900, easing: 'ease-out', fill: 'forwards' }).finished;

export function createTransitions({ home, player, nav, mosaic, toast }) {
  let busy = false, hidden = null; // hidden：被替身“借走”而隐藏的格子
  const lock = on => { busy = on; player.busy = on; };
  const startMusic = () => player.fadePlay(FADE_IN_MS).catch(() => toast('按空格开始播放'));

  // 替身缩回某个格子
  async function shrinkTo(ghost, tile) {
    const cur = ghost.getBoundingClientRect(), rect = rectOf(tile);
    ghost.getAnimations().forEach(a => { a.commitStyles(); a.cancel(); });
    await run(ghost, [
      { ...box(cur), borderRadius: '0px' },
      { ...box(rect), borderRadius: '6px' },
    ], { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
  }

  // 转场中途出任何错：清掉替身；如果没进到播放页就把首页恢复；最后一定解锁，页面不能被锁死
  function recover(err) {
    document.querySelectorAll('#ghost').forEach(g => g.remove());
    if (!player.active) {
      home.classList.remove('away');
      if (hidden) { hidden.style.visibility = ''; hidden = null; }
    }
    toast(`出错了：${err?.message || err}`);
  }
  // 只有拿到锁的这一次调用才负责解锁：转场进行中再点按钮直接忽略，不能把正在进行的那个解锁
  const guarded = fn => async (...args) => {
    if (busy) return;
    try { await fn(...args); } catch (err) { recover(err); } finally { lock(false); }
  };

  async function enter(tile, getSong) {
    if (busy) return; lock(true);
    const cover = tile.querySelector('img');
    const rect = rectOf(tile);
    const ghost = makeGhost(cover.src, rect);
    tile.style.visibility = 'hidden'; hidden = tile;

    const songP = getSong();
    const grow = run(ghost, [
      { ...box(rect), borderRadius: '6px' },
      { ...box(square()), borderRadius: '0px' },
    ], { duration: 800, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    home.classList.add('away');

    let song;
    try {
      [song] = await Promise.all([songP, grow.finished]);
      if (!song.data) throw new Error('这首歌暂时没有播放链接');
    } catch (err) {
      toast(err.message);
      home.classList.remove('away');
      await shrinkTo(ghost, tile);
      tile.style.visibility = ''; hidden = null;
      ghost.remove(); lock(false);
      return;
    }
    nav.enter(song);
    player.start(song, cover);
    player.setPrevEnabled(nav.canPrev);
    startMusic();
    await dissolve(ghost);
    ghost.remove(); lock(false);
  }

  async function leave() {
    if (busy || !nav.current) return; lock(true);
    const current = nav.current;
    const { tileOf, searchTile } = mosaic();
    // 缩回当前这首在拼图里的格子；不在拼图里（搜索来的）就让搜索格变成它
    if (hidden) hidden.style.visibility = '';
    let tile = tileOf.get(current.id);
    if (!tile) { tile = searchTile; tile.show(current); }
    tile.style.visibility = 'hidden'; hidden = tile;

    const ghost = makeGhost(smallCover(current.picture), square(), { borderRadius: '0px' });
    player.fadePause(FADE_OUT_MS);
    await condense(ghost);
    player.stop();
    nav.leave();
    home.classList.remove('away');
    await shrinkTo(ghost, tile);
    tile.style.visibility = ''; hidden = null;
    ghost.remove(); lock(false);
  }

  async function switchTo(kind) {
    if (busy || !nav.current || (kind === 'prev' && !nav.canPrev)) return; lock(true);
    const saved = player.suspendLyrics();
    player.fadePause(FADE_OUT_MS);

    // 要换成哪首：上一曲取历史；下一曲先沿原路，否则随机（拿不到链接就换一首随机，最多 3 次）
    const plan = kind === 'prev' ? { target: nav.planPrev(), fromForward: false } : nav.planNext();
    const ghost = makeGhost(smallCover(plan.target.picture), square(), { borderRadius: '0px', opacity: 0 });

    let song = null, cand = plan.target;
    const maxTries = kind === 'prev' ? 1 : plan.fromForward ? 4 : 3;
    const fetchIt = async () => {
      for (let i = 0; i < maxTries && !song; i++) {
        try { const s = await fetchSong(cand.id); if (s.data) song = s; } catch { /* 换下一首 */ }
        if (!song && kind === 'next') { cand = nav.pickRandom(); ghost.src = smallCover(cand.picture); }
      }
    };
    await Promise.all([fetchIt(), condense(ghost)]);

    if (!song) {
      toast(kind === 'prev' ? '上一曲暂时放不了' : '没有找到能播放的歌');
      player.resumeLyrics(saved);
      player.fadePlay(500).catch(() => {});
    } else {
      if (kind === 'prev') nav.commitPrev(song);
      else nav.commitNext(song, plan.fromForward, plan.target);
      if (!ghost.complete) await ghost.decode().catch(() => {});
      player.start(song, ghost);
      player.setPrevEnabled(nav.canPrev);
      startMusic();
    }
    await dissolve(ghost);
    ghost.remove(); lock(false);
  }

  return { enter: guarded(enter), leave: guarded(leave), switchTo: guarded(switchTo), get busy() { return busy; } };
}
