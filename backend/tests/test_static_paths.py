# 网站可能挂在子路径（/blur/）下：页面引用的资源都必须是相对路径
import re
from os import path

FRONTEND = path.join(path.dirname(path.dirname(path.dirname(path.abspath(__file__)))), 'frontend')


def test_index_uses_relative_asset_paths():
    html = open(path.join(FRONTEND, 'index.html'), encoding='utf-8').read()
    refs = re.findall(r'(?:href|src)="([^"]+)"', html)
    assert refs, '没找到资源引用'
    assert [r for r in refs if r.startswith('/')] == []


def test_backend_serves_frontend_files(client):
    assert client.get('/').status_code == 200
    assert client.get('/js/main.js').status_code == 200
    assert client.get('/css/site.css').status_code == 200
