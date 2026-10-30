import { test } from 'node:test';
import assert from 'node:assert/strict';
import { any } from './stub-dom.js';

test('api.js 能加载，smallCover 只给网易云图片加小图参数', async () => {
  const { smallCover } = await import('../js/api.js');
  assert.equal(smallCover('https://p2.music.126.net/a.jpg'), 'https://p2.music.126.net/a.jpg?param=200y200');
  assert.equal(smallCover('https://img2.kuwo.cn/a.jpg'), 'https://img2.kuwo.cn/a.jpg');
  assert.equal(smallCover(null), null);
});

test('画面模块的顶层与工厂函数能完整执行', async () => {
  const { createBackground } = await import('../js/background.js');
  const { createStage } = await import('../js/lyrics-stage.js');
  const { createPlayer } = await import('../js/player.js');
  const bg = createBackground(any());
  bg.step(0.016);
  const stage = createStage(any(), bg);
  stage.fit(); stage.sweep(0);
  const player = createPlayer({ playerEl: any(), titleEl: any(), audio: any(), stage, bg });
  assert.equal(typeof player.start, 'function');
  assert.equal(player.playing, false);
});
