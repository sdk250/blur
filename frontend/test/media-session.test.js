import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metadataOf, createMediaSession } from '../js/media-session.js';

const BASE = 'https://example.com/blur/';
const fakeSession = () => ({ handlers: {}, metadata: undefined, playbackState: 'none',
  setActionHandler(a, fn) { if (a === 'bogus') throw new TypeError('unknown'); this.handlers[a] = fn; } });

test('元数据：歌手用 / 连接，本地封面的相对路径转成绝对地址', () => {
  const m = metadataOf({ name: '白山茶', art: ['陈雪凝'], picture: 'local/local-baishancha/cover' }, BASE);
  assert.equal(m.title, '白山茶');
  assert.equal(m.artist, '陈雪凝');
  assert.equal(m.artwork[0].src, 'https://example.com/blur/local/local-baishancha/cover');
  assert.equal(metadataOf({ name: 'x', art: ['a', 'b'], picture: 'https://p1.music.126.net/x.jpg' }, BASE).artwork[0].src,
    'https://p1.music.126.net/x.jpg');
  assert.deepEqual(metadataOf({ name: 'x', art: [], picture: null }, BASE).artwork, []);
});

test('绑定动作；不认识的动作不抛错；没有上一曲时拿掉上一曲按钮', () => {
  const s = fakeSession();
  const ms = createMediaSession(s, BASE);
  const prev = () => {};
  ms.bind({ play() {}, previoustrack: prev, bogus() {} });
  assert.equal(typeof s.handlers.play, 'function');
  ms.setCanPrev(false);
  assert.equal(s.handlers.previoustrack, null);
  ms.setCanPrev(true);
  assert.equal(s.handlers.previoustrack, prev);
});

test('播放状态与清空', () => {
  const s = fakeSession();
  globalThis.MediaMetadata = class { constructor(init) { Object.assign(this, init); } };
  const ms = createMediaSession(s, BASE);
  ms.setSong({ name: 'a', art: ['b'], picture: null });
  assert.equal(s.metadata.title, 'a');
  ms.setPlaying(true); assert.equal(s.playbackState, 'playing');
  ms.setPlaying(false); assert.equal(s.playbackState, 'paused');
  ms.setSong(null);
  assert.equal(s.metadata, null);
  assert.equal(s.playbackState, 'none');
  delete globalThis.MediaMetadata;
});

test('浏览器不支持时所有方法都是空操作', () => {
  const ms = createMediaSession(undefined, BASE);
  ms.bind({ play() {} }); ms.setSong({ name: 'a' }); ms.setPlaying(true); ms.setCanPrev(false);
});
