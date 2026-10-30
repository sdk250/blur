// 后端接口（同源、相对路径：网站可能挂在 /blur/ 这类子路径下）。非 2xx 时抛出 Error(后端给的 msg)

/** 封面一律用 200px 小图：拼图、搜索格、放大铺满都用它，带宽留给音乐 */
export const smallCover = url => (url && url.includes('music.126.net') ? `${url}?param=200y200` : url);

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
  return data;
}
// 后端对上游有 5s/15s 超时；浏览器这边再兜一层，卡住时转场能失败退出而不是一直挂着
const TIMEOUT_MS = 20000;
const signal = () => AbortSignal.timeout(TIMEOUT_MS);
const post = (path, form) => fetch(path, { method: 'POST', body: new URLSearchParams(form), signal: signal() }).then(json);

export const fetchTop = (limit = 100) => fetch(`top?limit=${limit}`, { signal: signal() }).then(json);
export const fetchSong = id => post('id', { songid: id });
export const searchSong = key => post('key', { key, platform: 'netease' });
