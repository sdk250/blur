import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLines, schedule, planPositions, lineAt } from '../js/lyrics-plan.js';
import { seeded } from './helpers.js';

const view = { w: 1600, h: 900 };
const fixed = (w, h) => () => ({ w, h });
const inter = (a, b) =>
  Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2)) *
  Math.max(0, Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2));

test('toLines 丢空句、保留翻译换行、null 安全', () => {
  assert.deepEqual(toLines(null), []);
  assert.deepEqual(toLines({}), []);
  assert.deepEqual(toLines({ ms: [{ t: 1, c: ' 原\n译 ' }, { t: 4, c: '' }] }), [{ t: 1, text: '原\n译' }]);
});

test('schedule：至少飞完 3s，且等下一句', () => {
  const ls = [{ t: 0 }, { t: 0.7 }, { t: 10 }];
  schedule(ls, 3000);
  assert.equal(ls[0].exitAt, 3);
  assert.equal(ls[1].exitAt, 10);
  assert.equal(ls[2].exitAt, Infinity);
  assert.ok(Math.abs(ls[0].goneAt - 3.9) < 1e-9);
});

test('同屏的句子互不重叠（够放时）', () => {
  const ls = Array.from({ length: 5 }, (_, i) => ({ t: i * 0.7, text: 'x' }));
  schedule(ls, 3000);
  planPositions(ls, fixed(300, 60), view, seeded(7));
  for (let i = 0; i < ls.length; i++)
    for (let j = 0; j < i; j++)
      if (ls[j].goneAt > ls[i].t) assert.equal(inter(ls[i], ls[j]), 0, `${j} 与 ${i} 重叠`);
});

test('落点在屏幕内', () => {
  const ls = Array.from({ length: 30 }, (_, i) => ({ t: i * 4, text: 'x' }));
  schedule(ls, 3000);
  planPositions(ls, fixed(400, 80), view, seeded(3));
  for (const l of ls) {
    assert.ok(Math.abs(l.x) <= (view.w - 400) / 2 - 40 + 1e-9);
    assert.ok(Math.abs(l.y) <= view.h * 0.4 - 80 / 2 + 1e-9);
  }
});

test('包围盒带 40px 余量', () => {
  const ls = [{ t: 0, text: 'x' }];
  schedule(ls); planPositions(ls, fixed(300, 60), view, seeded(1));
  assert.equal(ls[0].w, 380); assert.equal(ls[0].h, 140);
});

test('超宽句不越界、不死循环', () => {
  const ls = [{ t: 0, text: 'x' }, { t: 5, text: 'y' }];
  schedule(ls); planPositions(ls, fixed(2000, 60), view, seeded(2));
  for (const l of ls) assert.equal(Math.abs(l.x), 0);
});

test('20 句挤在 5 秒内也能完成规划', () => {
  const ls = Array.from({ length: 20 }, (_, i) => ({ t: i * 0.25, text: 'x' }));
  schedule(ls); planPositions(ls, fixed(500, 120), view, seeded(5));
  for (const l of ls) assert.ok(Number.isFinite(l.x) && Number.isFinite(l.y));
});

test('lineAt', () => {
  const ls = [{ t: 1 }, { t: 2 }, { t: 5 }];
  assert.equal(lineAt(ls, 0.5), -1);
  assert.equal(lineAt(ls, 1), 0);
  assert.equal(lineAt(ls, 4.9), 1);
  assert.equal(lineAt(ls, 99), 2);
  assert.equal(lineAt([], 3), -1);
});

// ---------- 按空格把一句拆成几小句 ----------
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('中文按空格拆开，时间按字数比例分到这句和下一句之间', () => {
  const ls = toLines({ ms: [{ t: 39.83, c: '在某年 在某月 在某个' }, { t: 42.76, c: '波澜不惊 日子里' }] });
  assert.deepEqual(ls.slice(0, 3).map(l => l.text), ['在某年', '在某月', '在某个']);
  const span = 42.76 - 39.83;
  assert.ok(near(ls[0].t, 39.83) && near(ls[1].t, 39.83 + span / 3) && near(ls[2].t, 39.83 + span * 2 / 3));
  assert.deepEqual(ls.slice(3).map(l => l.text), ['波澜不惊', '日子里']);
  assert.ok(near(ls[3].t, 42.76));
});

test('后面是长间奏时，按每字 0.4 秒算，不把小句拖散', () => {
  const ls = toLines({ ms: [{ t: 10, c: '我爱你 你爱他 最后我' }, { t: 30, c: '下一句' }] });
  assert.ok(near(ls[1].t, 10 + 9 * 0.4 / 3) && near(ls[2].t, 10 + 9 * 0.4 * 2 / 3));
});

test('最后一句没有下一句，也按每字 0.4 秒', () => {
  const ls = toLines({ ms: [{ t: 5, c: '甲乙 丙丁' }] });
  assert.ok(near(ls[1].t, 5 + 4 * 0.4 / 2));
});

test('英文不拆；中英混排时英文旁边的空格不拆', () => {
  assert.deepEqual(toLines({ ms: [{ t: 1, c: 'let it go' }] }).map(l => l.text), ['let it go']);
  assert.deepEqual(toLines({ ms: [{ t: 1, c: '我说 let it go 就好' }] }).map(l => l.text), ['我说 let it go 就好']);
});

test('带翻译的句子不拆（翻译对应整句）', () => {
  assert.deepEqual(toLines({ ms: [{ t: 1, c: '在某年 在某月\nIn some year' }] }).map(l => l.text), ['在某年 在某月\nIn some year']);
});

test('全角空格和连续空格都算一个分隔', () => {
  assert.deepEqual(toLines({ ms: [{ t: 1, c: '心碎了　 突然想你了' }, { t: 9, c: 'x' }] }).slice(0, 2).map(l => l.text), ['心碎了', '突然想你了']);
});
