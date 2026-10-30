// 后端接口（同源）。非 2xx 时抛出 Error(后端给的 msg)

/** 封面一律用 200px 小图：拼图、搜索格、放大铺满都用它，带宽留给音乐 */
export const smallCover = url => (url && url.includes('music.126.net') ? `${url}?param=200y200` : url);

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
  return data;
}
const post = (path, form) => fetch(path, { method: 'POST', body: new URLSearchParams(form) }).then(json);

export const fetchTop = (limit = 100) => fetch(`/top?limit=${limit}`).then(json);
export const fetchSong = id => post('/id', { songid: id });
export const searchSong = key => post('/key', { key, platform: 'netease' });
