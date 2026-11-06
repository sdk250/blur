"""音乐站后端：榜单、按 ID 取歌、搜索。

接口
  GET  /top?limit=100       榜单（来自 top.json），每首只有 id / name / art / picture，用来铺封面拼图
  POST /id    songid=...&level=exhigh   一首歌的完整信息（播放链接 + 封面 + 歌词）；不传 songid 则从榜单随机一首
              会员歌曲需要在 backend/cookie.txt 放会员账号的 Cookie（至少 MUSIC_U），否则这类歌 data 为 null
  POST /key   key=...   搜索，返回最匹配的一首（结构同 /id）

/id 和 /key 返回：
  { id, name, art: [歌手], data: 播放链接|null, picture: 封面|null,
    lyric: { ti, ar, al, by, offset, ms: [{ t: 秒, c: 歌词 }] } | null }
  有翻译时，翻译用换行接在同一时间点的原句后面；ms 末尾会补一条空歌词（最后一句 +3s）。
"""
from binascii import hexlify, unhexlify
from json import dumps, loads
from os import environ, path
from hashlib import md5
from random import choice, randrange
from re import IGNORECASE, compile

from Crypto.Cipher import AES
from flask import Flask, Response, abort, request, send_file
from requests import Session

HERE = path.dirname(path.abspath(__file__))
FRONTEND = path.join(HERE, '..', 'frontend')
USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0'
)
NETEASE_KEY = unhexlify('7246674226682325323F5E6544673A51')
EAPI_KEY = b'e82ckenh8dichen8'
EAPI_UA = (
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/91.0.4472.164 NeteaseMusicDesktop/2.10.2.200154'
)
# 音质：standard / exhigh(320k mp3) / lossless(flac) / hires ...，会员歌曲需要 cookie.txt
DEFAULT_LEVEL = 'exhigh'

app = Flask(__name__, static_folder=FRONTEND, static_url_path='')  # 前端和接口同源
app.url_map.strict_slashes = False
session = Session()
TIMEOUT = (5, 15)  # 连接 / 读取超时：上游卡住时尽快失败，不让前端转场一直挂着
session.headers['User-Agent'] = USER_AGENT


def json_response(data, status: int = 200) -> Response:
    return Response(dumps(data, ensure_ascii=False), status=status, mimetype='application/json')


def https(url: str | None) -> str | None:
    """只替换开头的 http://（原来的 replace('http', 'https') 会把 https 变成 httpss）。"""
    if not url:
        return None
    return 'https://' + url[len('http://'):] if url.startswith('http://') else url


# ---------- 榜单 ----------

def load_top() -> list[dict]:
    with open(path.join(HERE, 'top.json'), 'rb') as f:
        tracks = loads(f.read())['result']['tracks']
    return [
        dict(
            id=t['id'],
            name=t['name'],
            art=[a['name'] for a in t.get('artists', [])],
            picture=https(t.get('album', {}).get('picUrl')),
        )
        for t in tracks
    ]


TOP = load_top()


@app.route('/top', methods=['GET'])
def top():
    try:
        limit = int(request.args.get('limit', 100))
    except ValueError:
        limit = 100
    return json_response(TOP[:max(0, limit)])


# ---------- 网易云 ----------

def netease(url: str, params: dict) -> dict:
    """通过 linux/forward 转发请求，参数 AES-ECB 加密。"""
    data = dumps({'method': 'POST', 'url': url, 'params': params}).encode('UTF-8')
    pad = 16 - len(data) % 16
    data += bytes([pad]) * pad
    eparams = hexlify(AES.new(NETEASE_KEY, AES.MODE_ECB).encrypt(data)).upper().decode()
    return loads(session.post(
        timeout=TIMEOUT,
        url='https://music.163.com/api/linux/forward',
        headers={'Referer': 'https://music.163.com/'},
        data={'eparams': eparams},
    ).content)


TIME_TAG = compile(r'\[(\d+):(\d+(?:\.\d+)?)\]')
META_TAG = compile(r'^\[(ti|ar|al|by|offset):(.*)\]$', IGNORECASE)


def parse_lrc(texts: list[str]) -> dict | None:
    """把原文和翻译的 LRC 合成一份；同一时间点的多行用换行拼起来。"""
    lrc = dict(ti='', ar='', al='', by='', offset=0, ms=[])
    by_time: dict[float, dict] = {}
    for text in texts:
        for line in (text or '').splitlines():
            line = line.strip()
            if not line:
                continue
            meta = META_TAG.match(line)
            if meta:
                key, value = meta.group(1).lower(), meta.group(2).strip()
                lrc[key] = int(value) if key == 'offset' and value.lstrip('-').isdigit() else value
                continue
            tags = TIME_TAG.findall(line)
            if not tags:
                continue
            content = TIME_TAG.sub('', line).strip()
            for m, s in tags:
                t = round(int(m) * 60 + float(s), 3)
                if t in by_time:
                    by_time[t]['c'] += '\n' + content
                else:
                    by_time[t] = dict(t=t, c=content)
    if not by_time:
        return None
    lrc['ms'] = sorted(by_time.values(), key=lambda x: x['t'])
    lrc['ms'].append(dict(t=lrc['ms'][-1]['t'] + 3, c=''))
    return lrc


def load_cookies() -> dict:
    """读 backend/cookie.txt（会员账号的网页版 Cookie，至少要有 MUSIC_U），格式 a=1; b=2，也可以一行一个。"""
    file = path.join(HERE, 'cookie.txt')
    if not path.exists(file):
        return {}
    cookies = {}
    with open(file, encoding='UTF-8') as f:
        for part in f.read().replace('\n', ';').split(';'):
            if '=' in part:
                k, v = part.split('=', 1)
                cookies[k.strip()] = v.strip()
    return cookies


COOKIES = load_cookies()


def eapi(url: str, payload: dict) -> dict:
    """客户端 eapi：参数是 “路径-36cd479b6b5-JSON-36cd479b6b5-摘要” 的 AES-ECB 加密，带登录 Cookie。"""
    url_path = url.split('music.163.com', 1)[1].replace('/eapi/', '/api/')
    body = dumps(payload)
    digest = md5(f'nobody{url_path}use{body}md5forencrypt'.encode()).hexdigest()
    data = f'{url_path}-36cd479b6b5-{body}-36cd479b6b5-{digest}'.encode()
    pad = 16 - len(data) % 16
    data += bytes([pad]) * pad
    params = AES.new(EAPI_KEY, AES.MODE_ECB).encrypt(data).hex()
    cookies = {'os': 'pc', 'appver': '', 'osver': '', 'deviceId': 'pyncm!', **COOKIES}
    return loads(session.post(
        timeout=TIMEOUT,
        url=url,
        headers={'User-Agent': EAPI_UA, 'Referer': 'https://music.163.com/'},
        cookies=cookies,
        data={'params': params},
    ).content)


def netease_url(song_id: int | str, level: str) -> str | None:
    header = {'os': 'pc', 'appver': '', 'osver': '', 'deviceId': 'pyncm!', 'requestId': str(randrange(20000000, 30000000))}
    result = eapi('https://interface3.music.163.com/eapi/song/enhance/player/url/v1', {
        'ids': [int(song_id)], 'level': level, 'encodeType': 'flac', 'header': dumps(header),
    })
    item = (result.get('data') or [{}])[0]
    # 没登录 / 没会员时，会员歌曲只给 30 秒试听片段（freeTrialInfo 不为空），当成没有链接
    if not item.get('url') or item.get('freeTrialInfo'):
        return None
    return https(item['url'])


def netease_song(song_id: int | str, level: str = DEFAULT_LEVEL) -> dict:
    detail = netease('https://music.163.com/api/v3/song/detail', {'c': dumps([{'id': song_id}])})
    song = detail['songs'][0]
    lyric = netease('https://music.163.com/api/song/lyric/v1', {
        'id': song_id, 'cp': False, 'tv': 0, 'lv': 0, 'rv': 0, 'kv': 0, 'yv': 0, 'ytv': 0, 'yrv': 0,
    })
    return dict(
        id=int(song_id),
        name=song['name'],
        art=[a['name'] for a in song['ar']],
        data=netease_url(song_id, level),
        picture=https(song['al'].get('picUrl')),
        lyric=parse_lrc([
            lyric.get('lrc', {}).get('lyric', ''),
            lyric.get('tlyric', {}).get('lyric', ''),
        ]),
    )


def netease_search(key: str, level: str = DEFAULT_LEVEL) -> dict | None:
    # 走 linux/forward：海外服务器直接访问网页搜索接口，result 会是一串加密字符串
    result = netease('https://music.163.com/api/cloudsearch/pc', {'s': key, 'type': 1, 'offset': 0, 'limit': 1})
    found = result.get('result')
    songs = found.get('songs') if isinstance(found, dict) else None
    return netease_song(songs[0]['id'], level) if songs else None


# ---------- 彩蛋：本地歌 ----------
# 搜索框里准确输入关键词，就播放 assets/ 里的本地歌（文件不在时彩蛋不生效，照常搜索）

ASSETS = path.join(HERE, '..', 'assets')
LOCAL = {
    'local-baishancha': dict(key='白山茶', file='陈雪凝 - 白山茶', name='白山茶', art=['陈雪凝']),
}


def local_files(song_id: str) -> tuple[str, str] | None:
    entry = LOCAL.get(song_id)
    if not entry:
        return None
    flac, lrc = (path.join(ASSETS, entry['file'] + ext) for ext in ('.flac', '.lrc'))
    return (flac, lrc) if path.isfile(flac) and path.isfile(lrc) else None


def local_song(song_id: str) -> dict | None:
    files = local_files(song_id)
    if not files:
        return None
    with open(files[1], encoding='UTF-8') as f:
        lyric = parse_lrc([f.read()])
    entry = LOCAL[song_id]
    return dict(
        id=song_id, name=entry['name'], art=entry['art'],
        data=f'local/{song_id}/audio', picture=f'local/{song_id}/cover', lyric=lyric,  # 相对路径：可挂在子路径下
    )


def flac_picture(file: str) -> tuple[str, bytes] | None:
    """读 FLAC 元数据里的 PICTURE 块（类型 6），返回 (mime, 图片字节)。"""
    with open(file, 'rb') as f:
        if f.read(4) != b'fLaC':
            return None
        while True:
            head = f.read(4)
            if len(head) < 4:
                return None
            kind, size = head[0] & 0x7f, int.from_bytes(head[1:], 'big')
            block = f.read(size)
            if kind == 6:
                p = 4
                n = int.from_bytes(block[p:p + 4], 'big'); p += 4
                mime = block[p:p + n].decode(); p += n
                p += 4 + int.from_bytes(block[p:p + 4], 'big') + 16   # 描述 + 宽高色深
                n = int.from_bytes(block[p:p + 4], 'big'); p += 4
                return mime, block[p:p + n]
            if head[0] & 0x80:
                return None


@app.route('/local/<song_id>/audio', methods=['GET'])
def local_audio(song_id):
    files = local_files(song_id)
    if not files:
        abort(404)
    return send_file(files[0], mimetype='audio/flac', conditional=True)  # conditional：支持 Range，能拖动/续传


@app.route('/local/<song_id>/cover', methods=['GET'])
def local_cover(song_id):
    files = local_files(song_id)
    pic = files and flac_picture(files[0])
    if not pic:
        abort(404)
    return Response(pic[1], mimetype=pic[0])


# ---------- 路由 ----------

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')


@app.route('/id', methods=['POST'])
def song_by_id():
    song_id = request.form.get('songid') or choice(TOP)['id']
    if str(song_id).startswith('local-'):
        song = local_song(song_id)
        return json_response(song) if song else json_response({'msg': '没有这首本地歌'}, 404)
    try:
        return json_response(netease_song(song_id, request.form.get('level') or DEFAULT_LEVEL))
    except Exception as e:
        return json_response({'msg': f'获取失败: {e}'}, 502)


@app.route('/key', methods=['POST'])
def search():
    key = (request.form.get('key') or '').strip()
    if key.startswith('/'):  # 兼容旧写法：以 / 开头的关键词
        key = key[1:].strip()
    if not key:
        return json_response({'msg': '缺少关键词'}, 400)
    for song_id, entry in LOCAL.items():  # 彩蛋
        if key == entry['key'] and (song := local_song(song_id)):
            return json_response(song)
    try:
        song = netease_search(key, request.form.get('level') or DEFAULT_LEVEL)
    except Exception as e:
        return json_response({'msg': f'搜索失败: {e}'}, 502)
    return json_response(song) if song else json_response({'msg': '没有找到'}, 404)


if __name__ == '__main__':
    # 本地开发：python api.py；线上用 gunicorn（见 README）
    app.run(environ.get('BLUR_HOST', '0.0.0.0'), int(environ.get('BLUR_PORT', 20800)), debug=False)
