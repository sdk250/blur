// 最终审阅修复：浏览器请求超时、转场出错不能把页面锁死、搜索格每次都取新链接
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { any } from './stub-dom.js';

// 能记住属性的极简假元素（stub 的万能 Proxy 记不住 onclick）
function fakeEl() {
  const kids = {};
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    set innerHTML(v) {}, get innerHTML() { return ''; },
    querySelector(sel) { return (kids[sel] ??= fakeEl()); },
    appendChild() {}, animate: () => any(), addEventListener() {}, blur() {},
    closest: () => null,
  };
}

test('浏览器请求带超时信号', async () => {
  const calls = [];
  globalThis.fetch = (url, opts = {}) => { calls.push({ url, opts }); return new Promise(() => {}); };
  const { fetchTop, fetchSong, searchSong } = await import('../js/api.js');
  fetchTop(); fetchSong(1); searchSong('k');
  assert.equal(calls.length, 3);
  for (const c of calls) assert.ok(c.opts.signal, `${c.url} 没有超时`);
});

test('转场中途出错也会释放锁', async () => {
  const { createTransitions } = await import('../js/transition.js');
  const { Navigator } = await import('../js/navigation.js');
  const player = { busy: false, start() { throw new Error('坏数据'); }, setPrevEnabled() {}, fadePlay: async () => {}, fadePause: async () => {} };
  const tr = createTransitions({ home: any(), player, nav: new Navigator([]), mosaic: () => null, toast() {} });
  const tile = any();
  await tr.enter(tile, async () => ({ id: 1, data: 'x', name: 'n', art: [] })).catch(() => {});
  assert.equal(tr.busy, false);
  assert.equal(player.busy, false);
});

test('从搜索格进入时重新取链接（链接会过期）', async () => {
  const realDocument = globalThis.document;
  globalThis.document = { createElement: () => fakeEl() };
  const requested = [];
  globalThis.fetch = (url, opts = {}) => { requested.push(url + ' ' + (opts.body ?? '')); return new Promise(() => {}); };
  const { buildMosaic } = await import('../js/mosaic.js');
  let picked = null;
  const m = buildMosaic(fakeEl(), [], { onPick: (t, get) => { picked = get; }, toast() {} });
  m.searchTile.show({ id: 42, name: 'n', art: ['a'], picture: 'https://p1.music.126.net/x.jpg', data: 'https://old-link' });
  m.searchTile.onclick({ target: fakeEl() });
  assert.ok(picked, '没有触发进入');
  picked();
  assert.ok(requested.some(r => r.startsWith('/id') && r.includes('songid=42')), requested.join(' | '));
  globalThis.document = realDocument;
});

test('转场进行中再点别的按钮，不会提前解锁正在进行的转场', async () => {
  const { createTransitions } = await import('../js/transition.js');
  const { Navigator } = await import('../js/navigation.js');
  const player = { busy: false, start() {}, setPrevEnabled() {}, fadePlay: async () => {}, fadePause: async () => {} };
  const nav = new Navigator([{ id: 2 }]); nav.enter({ id: 1 });
  const tr = createTransitions({ home: any(), player, nav, mosaic: () => null, toast() {} });
  tr.enter(any(), () => new Promise(() => {})); // 取歌永远不返回：转场一直在进行
  await new Promise(r => setTimeout(r, 0));
  assert.equal(tr.busy, true);
  await tr.switchTo('next');
  await tr.leave();
  assert.equal(tr.busy, true, '第二次点击把正在进行的转场解锁了');
  assert.equal(player.busy, true);
});

test('播放器 toggle：播放 ↔ 暂停，空格和按钮共用', async () => {
  const { createPlayer } = await import('../js/player.js');
  const audio = { paused: true, volume: 1, play: async () => { audio.paused = false; }, pause() { audio.paused = true; }, addEventListener() {} };
  const p = createPlayer({ playerEl: any(), titleEl: any(), audio, stage: any(), bg: any() });
  await p.toggle();
  assert.equal(p.playing, true);
  await Promise.race([p.toggle(), new Promise(r => setTimeout(r, 0))]); // 淡出要等动画帧，不必等完
  assert.equal(p.playing, false);
});
