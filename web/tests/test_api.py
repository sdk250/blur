from hashlib import md5
from json import dumps

from Crypto.Cipher import AES

import api


def test_https_only_rewrites_prefix():
    assert api.https('http://a/b') == 'https://a/b'
    assert api.https('https://a/http') == 'https://a/http'
    assert api.https(None) is None


def test_parse_lrc_merges_translation_and_appends_end():
    lrc = api.parse_lrc(['[ti:歌]\n[00:01.50]原句\n[00:03.00]第二句', '[00:01.50]translation'])
    assert lrc['ti'] == '歌'
    assert lrc['ms'][0] == {'t': 1.5, 'c': '原句\ntranslation'}
    assert lrc['ms'][-1] == {'t': 6.0, 'c': ''}


def test_parse_lrc_empty_returns_none():
    assert api.parse_lrc(['', '']) is None
    assert api.parse_lrc(['纯文本没有时间']) is None


def test_top_limit_bounds(client):
    assert len(client.get('/top').get_json()) == 100
    assert len(client.get('/top?limit=3').get_json()) == 3
    assert client.get('/top?limit=abc').status_code == 200
    assert client.get('/top?limit=-5').get_json() == []
    assert set(client.get('/top?limit=1').get_json()[0]) == {'id', 'name', 'art', 'picture'}


def test_key_validation(client):
    assert client.post('/key', data={}).status_code == 400
    assert client.post('/key', data={'key': 'x', 'platform': 'qq'}).status_code == 400


def test_id_upstream_failure_is_502_json(client, monkeypatch):
    def fail(*a, **k):
        raise RuntimeError('boom')
    monkeypatch.setattr(api, 'netease_song', fail)
    r = client.post('/id', data={'songid': '1'})
    assert r.status_code == 502 and 'boom' in r.get_json()['msg']


def test_netease_url_treats_trial_as_missing(monkeypatch):
    monkeypatch.setattr(api, 'eapi', lambda url, p: {'data': [{'url': 'http://x/a.mp3', 'freeTrialInfo': {'start': 0}}]})
    assert api.netease_url(1, 'exhigh') is None
    monkeypatch.setattr(api, 'eapi', lambda url, p: {'data': [{'url': 'http://x/a.mp3', 'freeTrialInfo': None}]})
    assert api.netease_url(1, 'exhigh') == 'https://x/a.mp3'


def test_eapi_params_format(monkeypatch):
    sent = {}

    class Resp:
        content = b'{"code": 200}'

    def fake_post(url, data, **kw):
        sent['params'] = data['params']
        return Resp()
    monkeypatch.setattr(api.session, 'post', fake_post)

    payload = {'ids': [1], 'level': 'exhigh'}
    api.eapi('https://interface3.music.163.com/eapi/song/enhance/player/url/v1', payload)

    raw = AES.new(api.EAPI_KEY, AES.MODE_ECB).decrypt(bytes.fromhex(sent['params']))
    plain = raw[:-raw[-1]].decode()
    path, body, digest = plain.split('-36cd479b6b5-')
    assert path == '/api/song/enhance/player/url/v1'
    assert body == dumps(payload)
    assert digest == md5(f'nobody{path}use{body}md5forencrypt'.encode()).hexdigest()


def test_index_served(client):
    r = client.get('/')
    assert r.status_code == 200 and b'<div id="home">' in r.data


def test_credentials_and_source_not_served(client):
    for p in ('/cookie.txt', '/api.py', '/top.json', '/../cookie.txt'):
        assert client.get(p).status_code == 404, p


def test_every_upstream_request_has_timeout(monkeypatch):
    seen = []

    class Resp:
        content = b'{"code": 200, "songs": [{"name": "n", "ar": [], "al": {}}], "result": {}, "data": [{}]}'

    def record(*a, **k):
        seen.append(k.get('timeout'))
        return Resp()
    monkeypatch.setattr(api.session, 'get', record)
    monkeypatch.setattr(api.session, 'post', record)
    api.netease('https://music.163.com/api/x', {})
    api.eapi('https://interface3.music.163.com/eapi/x', {})
    api.netease_search('k')
    assert seen and all(t for t in seen), seen


def test_no_cross_origin_access(client):
    r = client.get('/top?limit=1', headers={'Origin': 'http://evil.example'})
    assert 'Access-Control-Allow-Origin' not in r.headers
