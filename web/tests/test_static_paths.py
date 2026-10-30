# 网站可能挂在子路径（/blur/）下：页面引用的资源都必须是相对路径
import re
from os import path

STATIC = path.join(path.dirname(path.dirname(__file__)), 'static')


def test_index_uses_relative_asset_paths():
    html = open(path.join(STATIC, 'index.html'), encoding='utf-8').read()
    refs = re.findall(r'(?:href|src)="([^"]+)"', html)
    assert refs, '没找到资源引用'
    assert [r for r in refs if r.startswith('/')] == []
