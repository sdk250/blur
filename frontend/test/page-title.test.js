// 网页标题：播放时是当前歌词，回主页是 Blur
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageTitle } from '../js/page-title.js';

const song = { name: '白山茶', art: ['陈雪凝'] };
const lines = [{ t: 1, text: '我不是在等你\nI am not waiting' }, { t: 3, text: '我只是在等爱你的心死' }];

test('不在播放：Blur', () => assert.equal(pageTitle(null, [], -1), 'Blur'));
test('第一句之前 / 没有歌词：歌名 · 歌手', () => {
  assert.equal(pageTitle(song, lines, -1), '白山茶 · 陈雪凝');
  assert.equal(pageTitle(song, [], -1), '白山茶 · 陈雪凝');
});
test('播放中：当前歌词，只取原句（翻译不进标题）', () => {
  assert.equal(pageTitle(song, lines, 0), '我不是在等你');
  assert.equal(pageTitle(song, lines, 1), '我只是在等爱你的心死');
});
