import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Navigator } from '../js/navigation.js';
import { seeded } from './helpers.js';

const S = id => ({ id });
const pool = n => Array.from({ length: n }, (_, i) => S(i));
// 走一步“下一曲”且成功
const next = nav => { const p = nav.planNext(); nav.commitNext(p.target, p.fromForward, p.target); return p; };
const prev = nav => { const s = nav.planPrev(); nav.commitPrev(s); return s; };

test('下一曲 → 上一曲 → 下一曲 回到原来那首', () => {
  const nav = new Navigator(pool(20), seeded(1));
  nav.enter(S(0));
  const a = next(nav);
  assert.equal(a.fromForward, false);
  assert.equal(prev(nav).id, 0);
  const b = nav.planNext();
  assert.equal(b.fromForward, true);
  assert.equal(b.target.id, a.target.id);
});

test('连退三首，下一曲沿原路走三步，走完才随机', () => {
  const nav = new Navigator(pool(50), seeded(2));
  nav.enter(S(0));
  const path = [0, next(nav).target.id, next(nav).target.id, next(nav).target.id];
  prev(nav); prev(nav); prev(nav);
  assert.equal(nav.current.id, 0);
  for (let k = 1; k <= 3; k++) {
    const p = next(nav);
    assert.equal(p.fromForward, true);
    assert.equal(p.target.id, path[k]);
  }
  assert.equal(nav.planNext().fromForward, false);
});

test('从拼图点进新歌清空前进栈', () => {
  const nav = new Navigator(pool(20), seeded(3));
  nav.enter(S(0)); next(nav); prev(nav);
  nav.leave(); nav.enter(S(9));
  assert.equal(nav.planNext().fromForward, false);
});

test('原路那首放不了、换成随机歌 → 前进栈清空', () => {
  const nav = new Navigator(pool(20), seeded(4));
  nav.enter(S(0)); next(nav); next(nav); prev(nav); prev(nav);
  const p = nav.planNext();
  assert.equal(p.fromForward, true);
  nav.commitNext(S(19), true, p.target); // 实际播的是另一首
  assert.equal(nav.current.id, 19);
  assert.equal(nav.planNext().fromForward, false);
});

test('随机避开当前与最近 10 首', () => {
  const songs = pool(12);
  const nav = new Navigator(songs, seeded(5));
  nav.enter(songs[0]);
  for (let i = 1; i <= 10; i++) nav.commitNext(songs[i], false, songs[i]); // 历史 0..9，当前 10
  for (let k = 0; k < 20; k++) assert.equal(nav.pickRandom().id, 11);
});

test('pool 全被避开时退回整个 pool', () => {
  const songs = pool(3);
  const nav = new Navigator(songs, seeded(6));
  nav.enter(songs[0]); nav.commitNext(songs[1], false, songs[1]); nav.commitNext(songs[2], false, songs[2]);
  assert.ok(songs.includes(nav.pickRandom()));
});

test('canPrev；返回拼图后再进别的歌，上一曲仍是离开前那首', () => {
  const nav = new Navigator(pool(20), seeded(7));
  nav.enter(S(0));
  assert.equal(nav.canPrev, false);
  nav.leave();
  assert.equal(nav.current, null);
  nav.enter(S(5));
  assert.equal(nav.canPrev, true);
  assert.equal(nav.planPrev().id, 0);
});

test('只 plan 不 commit（切歌失败）不改动栈', () => {
  const nav = new Navigator(pool(20), seeded(8));
  nav.enter(S(0)); const a = next(nav); prev(nav);
  nav.planNext(); nav.planPrev();
  assert.equal(nav.current.id, 0);
  assert.equal(nav.planNext().target.id, a.target.id);
  assert.equal(nav.canPrev, false);
});

test('搜索直接播放：当前这首进历史，前进栈清空，上一曲能回来', () => {
  const nav = new Navigator(pool(20), seeded(3));
  nav.enter(S(0));
  next(nav); prev(nav); // 前进栈里有一首
  assert.equal(nav.planNext().fromForward, true);
  nav.commitPick(S(99));
  assert.equal(nav.current.id, 99);
  assert.equal(nav.planNext().fromForward, false);
  assert.equal(prev(nav).id, 0);
});
