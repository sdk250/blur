// 歌词：转行、在场时间、落点规划。纯函数，量字宽由调用方传入
import { tune, EXIT_MS } from './tune.js';

const PAD = 40;   // 包围盒四周余量，留给漂浮和弯曲
const TRIES = 60;

const SEC_PER_CHAR = 0.4; // 拆开的小句按字数分时间；后面是长间奏时，按这个语速估算时长
const HAN = /\p{Script=Han}/u; // 只拆汉字与汉字之间的空格

// 有些歌词里混着长得像汉字的部首、兼容字符（如 U+2F3C ⼼），字体里的字形和正常汉字不一样，Windows 上会明显变细。
// 只转这几段：整体 NFKC 会连全角冒号、省略号一起改掉
const LOOKALIKE = /[\u2E80-\u2FDF\uF900-\uFAFF\u{2F800}-\u{2FA1F}]/gu;
const plainHan = text => text.replace(LOOKALIKE, ch => ch.normalize('NFKC'));

// 一句按空格拆成几小句：只拆两边都是汉字的空格（“词 : 某某”、“A - B”、英文单词之间都不拆），带翻译的不拆
function splitParts(text) {
  if (text.includes('\n')) return [text];
  const parts = [];
  let cur = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/\s/.test(ch)) {
      let j = i; while (j + 1 < chars.length && /\s/.test(chars[j + 1])) j++;
      const before = chars[i - 1] || '', after = chars[j + 1] || '';
      if (cur && HAN.test(before) && HAN.test(after)) { parts.push(cur); cur = ''; }
      else cur += ' ';
      i = j;
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

/**
 * 接口的 lyric.ms -> [{t, text}]；丢掉空句（末尾那条只是结束标记）。翻译在换行之后。
 * 中文句子里用空格隔开的几段拆成几小句，时间按字数比例排在这句和下一句之间（split: false 时不拆）。
 */
export function toLines(lyric, { split = true } = {}) {
  const raw = (lyric?.ms || []).map(l => ({ t: l.t, text: plainHan(l.c || '').trim() }));
  const out = [];
  raw.forEach((l, i) => {
    if (!l.text) return;
    const parts = split ? splitParts(l.text) : [l.text];
    if (parts.length === 1) { out.push({ t: l.t, text: parts[0] }); return; }
    const sizes = parts.map(p => [...p].length), total = sizes.reduce((a, b) => a + b, 0);
    const next = raw.slice(i + 1).find(x => x.text) || raw[i + 1]; // 下一句（含末尾的结束标记）
    const span = Math.min(next ? next.t - l.t : Infinity, total * SEC_PER_CHAR);
    let done = 0;
    parts.forEach((text, k) => { out.push({ t: l.t + span * done / total, text }); done += sizes[k]; });
  });
  return out;
}

/** 每句的在场时间：至少飞完入场，且等到下一句出现才开始退场 */
export function schedule(lines, dur = tune.dur) {
  lines.forEach((ly, i) => {
    const next = lines[i + 1];
    ly.exitAt = Math.max(next ? next.t : Infinity, ly.t + dur / 1000);
    ly.goneAt = ly.exitAt + EXIT_MS / 1000;
  });
}

const overlap = (a, b) =>
  Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2)) *
  Math.max(0, Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2));

/**
 * 随机落点（相对屏幕中心的像素）：整句在屏幕内；和同屏的句子不重叠；
 * 尽量离上一句远一点，让视线需要“跳”。先 schedule 再调用。
 * measure(text) -> {w, h}（不含余量），view = {w, h}
 */
export function planPositions(lines, measure, view, rand = Math.random) {
  const minJump = Math.min(view.w, view.h) * 0.25;
  let last = null;
  lines.forEach((ly, i) => {
    const m = measure(ly.text);
    ly.w = m.w + PAD * 2; ly.h = m.h + PAD * 2;
    const maxX = Math.max(0, (view.w - m.w) / 2 - 40), maxY = Math.max(0, view.h * 0.4 - m.h / 2);
    const alive = lines.slice(0, i).filter(o => o.goneAt > ly.t);
    let best = null;
    for (let k = 0; k < TRIES; k++) {
      const c = { x: (rand() * 2 - 1) * maxX, y: (rand() * 2 - 1) * maxY, w: ly.w, h: ly.h };
      const hit = alive.reduce((s, o) => s + overlap(c, o), 0);
      const near = last && Math.hypot(c.x - last.x, c.y - last.y) < minJump ? 1 : 0;
      const score = hit * 10 + near * 1000;
      if (!best || score < best.score) best = { ...c, score };
      if (score === 0) break;
    }
    ly.x = best.x; ly.y = best.y;
    last = ly;
  });
}

/** 最后一个 t <= time 的下标，没有为 -1 */
export function lineAt(lines, time) {
  let i = -1;
  while (i + 1 < lines.length && lines[i + 1].t <= time) i++;
  return i;
}
