// 网页标题：播放时显示当前这句歌词（只取原句，翻译不进标题）；第一句之前 / 没歌词时显示“歌名 · 歌手”；回主页是 Blur
export function pageTitle(song, lines, idx) {
  if (!song) return 'Blur';
  if (idx < 0 || !lines[idx]) return `${song.name} · ${song.art.join(' / ')}`;
  return lines[idx].text.split('\n')[0];
}
