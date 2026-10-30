import sys
from os import path

import pytest

sys.path.insert(0, path.dirname(path.dirname(__file__)))
import api  # noqa: E402


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """任何测试都不许真的访问网络，也不带真实 Cookie。"""
    def boom(*a, **k):
        raise AssertionError('测试里不应访问网络')
    monkeypatch.setattr(api.session, 'get', boom)
    monkeypatch.setattr(api.session, 'post', boom)
    monkeypatch.setattr(api, 'COOKIES', {})


@pytest.fixture
def client():
    return api.app.test_client()
