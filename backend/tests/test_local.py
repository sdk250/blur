# 彩蛋：搜“白山茶”播放 assets 里的本地歌（封面取 FLAC 内嵌图，歌词取同名 .lrc）
import struct

import pytest

import api

JPEG = b'\xff\xd8\xff\xe0fake-jpeg\xff\xd9'


def make_flac(path, picture=JPEG):
    mime = b'image/jpeg'
    pic = (struct.pack('>I', 3) + struct.pack('>I', len(mime)) + mime + struct.pack('>I', 0)
           + struct.pack('>IIII', 1, 1, 24, 0) + struct.pack('>I', len(picture)) + picture)
    out = b'fLaC' + bytes([0]) + (34).to_bytes(3, 'big') + bytes(34)          # STREAMINFO
    out += bytes([6 | 0x80]) + len(pic).to_bytes(3, 'big') + pic              # PICTURE（最后一块）
    out += b'\xff\xf8' + bytes(4000)                                           # 假的音频帧
    path.write_bytes(out)


@pytest.fixture
def assets(tmp_path, monkeypatch):
    make_flac(tmp_path / '陈雪凝 - 白山茶.flac')
    (tmp_path / '陈雪凝 - 白山茶.lrc').write_text('[00:31.91]我不是在等你\n[00:33.91]我只是在等爱你的心死\n', encoding='utf-8')
    monkeypatch.setattr(api, 'ASSETS', str(tmp_path))
    return tmp_path


def test_search_easter_egg_returns_local_song(client, assets):
    r = client.post('/key', data={'key': ' 白山茶 '})
    assert r.status_code == 200
    s = r.get_json()
    assert s['id'] == 'local-baishancha'
    assert s['name'] == '白山茶' and s['art'] == ['陈雪凝']
    # 相对路径：网站可能挂在 /blur/ 这类子路径下
    assert s['data'] == 'local/local-baishancha/audio'
    assert s['picture'] == 'local/local-baishancha/cover'
    assert s['lyric']['ms'][0] == {'t': 31.91, 'c': '我不是在等你'}


def test_id_accepts_local_id(client, assets):
    assert client.post('/id', data={'songid': 'local-baishancha'}).get_json()['name'] == '白山茶'


def test_local_cover_is_embedded_picture(client, assets):
    r = client.get('/local/local-baishancha/cover')
    assert r.status_code == 200 and r.mimetype == 'image/jpeg' and r.data == JPEG


def test_local_audio_supports_range(client, assets):
    r = client.get('/local/local-baishancha/audio')
    assert r.status_code == 200 and r.mimetype == 'audio/flac'
    r = client.get('/local/local-baishancha/audio', headers={'Range': 'bytes=0-3'})
    assert r.status_code == 206 and r.data == b'fLaC'


def test_unknown_local_id_404(client, assets):
    assert client.get('/local/nope/audio').status_code == 404
    assert client.post('/id', data={'songid': 'local-nope'}).status_code == 404


def test_egg_needs_the_files(client, tmp_path, monkeypatch):
    monkeypatch.setattr(api, 'ASSETS', str(tmp_path))  # 空目录：彩蛋不生效，照常走网易云搜索
    monkeypatch.setattr(api, 'netease_search', lambda key, level='exhigh': {'id': 1, 'name': '网易云的白山茶'})
    assert client.post('/key', data={'key': '白山茶'}).get_json()['name'] == '网易云的白山茶'


def test_other_keywords_untouched(client, assets, monkeypatch):
    monkeypatch.setattr(api, 'netease_search', lambda key, level='exhigh': {'id': 1, 'name': key})
    assert client.post('/key', data={'key': '白山茶 陈雪凝'}).get_json()['name'] == '白山茶 陈雪凝'
