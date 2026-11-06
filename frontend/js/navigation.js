// 上一曲 / 下一曲：像浏览器的后退 / 前进。纯逻辑，失败时调用方不 commit，栈就不动
import { RECENT } from './tune.js';

export class Navigator {
  constructor(pool, rand = Math.random) {
    this.pool = pool;       // 随机下一曲的候选（拼图里那些歌）
    this.rand = rand;
    this.history = [];      // 往回
    this.forward = [];      // 往前
    this.current = null;
  }

  get canPrev() { return this.history.length > 0; }

  /** 从拼图点进一首歌 = 走了新路 */
  enter(song) {
    this.forward.length = 0;
    this.current = song;
  }

  /** 回拼图：当前这首进历史，之后从拼图点别的歌仍能“上一曲”回来 */
  leave() {
    if (this.current) this.history.push(this.current);
    this.current = null;
  }

  pickRandom() {
    const recent = new Set([this.current, ...this.history.slice(-RECENT)].filter(Boolean).map(s => s.id));
    const fresh = this.pool.filter(s => !recent.has(s.id));
    const from = fresh.length ? fresh : this.pool;
    return from[Math.floor(this.rand() * from.length)];
  }

  /** 下一曲：前进栈非空就沿原路回去，否则随机 */
  planNext() {
    if (this.forward.length) return { target: this.forward[this.forward.length - 1], fromForward: true };
    return { target: this.pickRandom(), fromForward: false };
  }

  planPrev() {
    return this.history.length ? this.history[this.history.length - 1] : null;
  }

  /** 下一曲成功：song 是实际播放的那首（原路那首放不了时可能换成了随机歌） */
  commitNext(song, fromForward, target) {
    if (this.current) this.history.push(this.current);
    if (fromForward) this.forward.pop();
    if (song.id !== target.id) this.forward.length = 0; // 原路断了
    this.current = song;
  }

  /** 搜索后直接播放：当前这首进历史，走了新路，前进栈清空 */
  commitPick(song) {
    if (this.current) this.history.push(this.current);
    this.forward.length = 0;
    this.current = song;
  }

  commitPrev(song) {
    this.history.pop();
    if (this.current) this.forward.push(this.current);
    this.current = song;
  }
}
