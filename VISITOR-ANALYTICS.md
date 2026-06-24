# 访客记录功能说明

## 当前完成范围

- 普通访客访问页面时，`assets/js/main.js` 会向 `/api/visit` 上报访问时间、IP、地理位置、浏览器版本、系统、页面、来源等信息。
- `visitor.html` 是访客可视化页面，会显示当前访问者信息、公开统计和后台查询入口。
- 后台查询入口需要 `BOOKER_ADMIN_PASSWORD`，登录后会显示最近 24 小时访客记录并支持分页。
- 登录后可以从 `visitor.html` 跳转到 `visitor-records.html` 查看完整访客记录，完整页支持搜索、分页和删除选中记录。
- 后端使用 `server/visitor_api.py` 和 SQLite，不依赖 Cloudflare。

## 本地预览

只用 `python -m http.server` 或双击 HTML 时没有 `/api`，访客功能不会工作。推荐直接运行：

```powershell
.\start-local-visitor.ps1
```

默认本地后台密码是：

```text
booker-local-admin
```

也可以自己指定本地密码：

```powershell
.\start-local-visitor.ps1 -AdminPassword "your-local-password"
```

手动启动方式如下：

```powershell
$env:BOOKER_ADMIN_PASSWORD = "your-local-password"
python .\server\visitor_api.py --serve --host 127.0.0.1 --port 8765 --static-root .
```

然后打开：

```text
http://127.0.0.1:8765/visitor.html
```

登录后台后，可以进入完整记录页：

```text
http://127.0.0.1:8765/visitor-records.html
```

## VPS 部署

推荐使用 PowerShell 部署脚本并初始化服务器：

```powershell
.\deploy.ps1 -SetupServer -VisitorAdminPassword "your-admin-password"
```

如果不传 `-VisitorAdminPassword`：

- VPS 已有 `/etc/booker-visitor.env` 时，会保留现有后台密码。
- 首次安装且没有旧配置时，会自动生成一个后台密码并在部署输出中显示一次。

部署脚本会配置：

- Nginx `/api/` 反代到 `127.0.0.1:8765`
- systemd 服务 `booker-visitor`
- 持久化数据库 `/var/lib/booker/visitors.db`
- VPS 查询命令 `/usr/local/bin/booker-visits`

## VPS 查询命令

查看服务状态：

```bash
sudo systemctl status booker-visitor --no-pager
```

查看最近日志：

```bash
sudo journalctl -u booker-visitor -n 100 --no-pager
```

查看统计：

```bash
sudo booker-visits --summary
```

查看最近访客：

```bash
sudo booker-visits --list --limit 20
```

搜索访客记录：

```bash
sudo booker-visits --list --q Chrome
sudo booker-visits --list --q /posts/
```

导出 CSV：

```bash
sudo booker-visits --export-csv /tmp/booker-visits.csv --limit 500
```

## 常见问题

- `visitor.html` 显示服务不可用：确认不是用纯静态服务预览，或在 VPS 上执行 `sudo systemctl status booker-visitor --no-pager`。
- 页面能打开但没有记录：确认 Nginx 有 `/api/` 反代，执行 `curl http://127.0.0.1:8765/api/health`。
- 后台登录失败：确认 `/etc/booker-visitor.env` 内的 `BOOKER_ADMIN_PASSWORD`，修改后执行 `sudo systemctl restart booker-visitor`。
- 完整记录页提示需要登录：先在 `visitor.html` 输入后台密码，登录成功后再点击“完整记录”。
