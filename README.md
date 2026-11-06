# Blur

重点在动效的音乐网站：首页是封面拼图，点进去后封面化开成色雾，歌词在 3D 隧道里飞出。

```
frontend/   前端：原生 HTML、CSS、JS（ES Modules），不需要构建
backend/    后端：Flask 接口，同时提供 frontend/ 里的静态文件
assets/     本地歌曲（不进仓库，可选）
```

## 本地运行

需要 Python 3.10+；跑前端测试需要 Node.js 18+。

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt -r requirements-dev.txt
.venv/bin/python api.py            # http://127.0.0.1:20800
```

可以用环境变量 `BLUR_HOST`、`BLUR_PORT` 改监听地址和端口。

## 测试

```bash
cd backend && .venv/bin/python -m pytest tests -q
cd frontend && ./run-tests.sh
```

## 不进仓库的文件

都是可选的，缺少时网站照常运行。

| 文件 | 作用 |
|---|---|
| `backend/cookie.txt` | 网易云会员 Cookie（至少含 `MUSIC_U`，格式 `a=1; b=2`），没有就放不了会员歌。这是登录凭证，权限设成 600 |
| `assets/<歌手> - <歌名>.flac` 和同名 `.lrc` | 彩蛋本地歌曲，在 `backend/api.py` 的 `LOCAL` 里配置 |

## 部署

下面以 `/srv/blur` 为安装目录，`20830` 为服务端口，`example.com` 为域名，按实际情况替换。

**1. 上传代码。** 目录结构要保持 `backend/` 和 `frontend/` 同级。

```bash
rsync -az --delete --exclude .venv --exclude cookie.txt \
  --exclude __pycache__ --exclude .pytest_cache --exclude tests \
  backend/ user@example.com:/srv/blur/backend/
rsync -az --delete --exclude test --exclude package.json --exclude run-tests.sh \
  frontend/ user@example.com:/srv/blur/frontend/
```

更新代码时也用这两条。`--exclude cookie.txt` 不能省，否则 `--delete` 会删掉服务器上的这个文件。只改前端不用重启服务，改了后端要执行 `systemctl restart blur`。

**2. 安装依赖。**

```bash
cd /srv/blur/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

**3. 配置 systemd：** `/etc/systemd/system/blur.service`

```ini
[Unit]
Description=Blur
After=network-online.target

[Service]
WorkingDirectory=/srv/blur/backend
ExecStart=/srv/blur/backend/.venv/bin/gunicorn --workers 2 --threads 4 --bind 127.0.0.1:20830 --access-logfile - api:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now blur
```

**4. 配置反向代理。** 网站可以挂在子路径下，前端用的都是相对路径。Apache 示例（需要启用 `proxy`、`proxy_http`）：

```apache
RedirectMatch 301 ^/blur$ https://example.com/blur/
ProxyPass /blur/ http://127.0.0.1:20830/ retry=1
ProxyPassReverse /blur/ http://127.0.0.1:20830/
```

服务只应监听本机，由反向代理对外。
