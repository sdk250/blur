// 长按播放页背景 -> 进入 / 退出全屏
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLongPress, toggleFullscreen } from '../js/fullscreen.js';

// 可手动推进的假定时器
function clock() {
  let now = 0, timers = [];
  return {
    set: (fn, ms) => { const t = { at: now + ms, fn }; timers.push(t); return t; },
    clear: t => { timers = timers.filter(x => x !== t); },
    advance(ms) { now += ms; for (const t of timers.filter(t => t.at <= now)) { this.clear(t); t.fn(); } },
  };
}

test('按住 600ms 不动 -> 触发一次', () => {
  const c = clock(); let fired = 0;
  const lp = createLongPress(() => fired++, { setTimer: c.set, clearTimer: c.clear });
  lp.down(100, 100);
  c.advance(599); assert.equal(fired, 0);
  c.advance(1); assert.equal(fired, 1);
  c.advance(2000); assert.equal(fired, 1);
});

test('提前松手不触发', () => {
  const c = clock(); let fired = 0;
  const lp = createLongPress(() => fired++, { setTimer: c.set, clearTimer: c.clear });
  lp.down(0, 0); c.advance(300); lp.up(); c.advance(1000);
  assert.equal(fired, 0);
});

test('手指移动超过 10px（在滑动）不触发；小抖动不算', () => {
  const c = clock(); let fired = 0;
  const lp = createLongPress(() => fired++, { setTimer: c.set, clearTimer: c.clear });
  lp.down(0, 0); lp.move(4, 5); c.advance(600);
  assert.equal(fired, 1);
  lp.down(0, 0); lp.move(15, 0); c.advance(1000);
  assert.equal(fired, 1);
});

test('触发后吞掉紧接着的那次点击，避免长按松手又点到东西', () => {
  const c = clock();
  const lp = createLongPress(() => {}, { setTimer: c.set, clearTimer: c.clear });
  lp.down(0, 0); c.advance(600); lp.up();
  assert.equal(lp.takeClick(), false);
  assert.equal(lp.takeClick(), true);
});

test('toggleFullscreen：不在全屏就进入，在全屏就退出', () => {
  const calls = [];
  const doc = { fullscreenElement: null, documentElement: { requestFullscreen: () => { calls.push('enter'); return Promise.resolve(); } }, exitFullscreen: () => { calls.push('exit'); return Promise.resolve(); } };
  toggleFullscreen(doc);
  doc.fullscreenElement = {};
  toggleFullscreen(doc);
  assert.deepEqual(calls, ['enter', 'exit']);
});

test('toggleFullscreen：兼容 webkit 前缀；都不支持时不报错', () => {
  const calls = [];
  const webkit = { webkitFullscreenElement: null, documentElement: { webkitRequestFullscreen: () => calls.push('wk') } };
  toggleFullscreen(webkit);
  assert.deepEqual(calls, ['wk']);
  assert.equal(toggleFullscreen({ documentElement: {} }), false);
});
