// 窗口大小变化：手机点搜索框弹出键盘会改变高度，不能因此把拼图（和输入框）整个重建
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRebuild } from '../js/resize-policy.js';

test('正在输入时不重建（手机键盘弹出/收起）', () => {
  assert.equal(shouldRebuild({ w: 390, h: 844 }, { w: 390, h: 500 }, true), false);
});
test('尺寸没变不重建', () => {
  assert.equal(shouldRebuild({ w: 390, h: 844 }, { w: 390, h: 844 }, false), false);
});
test('不在输入时，宽或高变了就重建（电脑拖窗口、手机转屏）', () => {
  assert.equal(shouldRebuild({ w: 1280, h: 800 }, { w: 1000, h: 800 }, false), true);
  assert.equal(shouldRebuild({ w: 1280, h: 800 }, { w: 1280, h: 600 }, false), true);
  assert.equal(shouldRebuild({ w: 390, h: 844 }, { w: 844, h: 390 }, false), true);
});
