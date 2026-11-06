// 系统的播放控制：耳机按键、锁屏/通知栏、键盘媒体键（Media Session API）。不支持的浏览器什么也不做

/** 一首歌 -> 系统显示的信息（歌名、歌手、封面）。封面转成绝对地址，系统界面不认相对路径 */
export function metadataOf(song, base) {
  const abs = u => { try { return new URL(u, base).href; } catch { return u; } };
  return {
    title: song.name || '',
    artist: (song.art || []).join(' / '),
    album: 'Blur',
    artwork: song.picture ? [{ src: abs(song.picture) }] : [],
  };
}

export function createMediaSession(ms = globalThis.navigator?.mediaSession, base = globalThis.location?.href) {
  const handlers = {};
  // 个别动作浏览器不认识时会抛错，忽略即可
  const setHandler = (action, fn) => { try { ms.setActionHandler(action, fn); } catch { /* 不支持这个动作 */ } };

  if (!ms) return { bind() {}, setSong() {}, setPlaying() {}, setCanPrev() {} };
  return {
    /** handlers: { play, pause, previoustrack, nexttrack } */
    bind(h) {
      Object.assign(handlers, h);
      for (const [action, fn] of Object.entries(h)) setHandler(action, fn);
    },
    setSong(song) {
      const M = globalThis.MediaMetadata;
      ms.metadata = song && M ? new M(metadataOf(song, base)) : null;
      if (!song) ms.playbackState = 'none';
    },
    setPlaying(on) { ms.playbackState = on ? 'playing' : 'paused'; },
    /** 没有上一曲时把这个按钮从系统界面上拿掉 */
    setCanPrev(on) { if (handlers.previoustrack) setHandler('previoustrack', on ? handlers.previoustrack : null); },
  };
}
