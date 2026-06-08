# Odile's Lab

纯静态个人技术博客项目，使用 HTML、CSS 和少量原生 JavaScript。项目不依赖数据库、后台管理、WordPress、宝塔、后端服务、外部 CDN、Google Fonts 或第三方追踪脚本。

## ✨ 最新功能

- ✅ **阅读进度条**：文章页顶部实时显示阅读进度
- ✅ **代码一键复制**：代码块悬停显示复制按钮
- ✅ **文章目录（TOC）**：自动生成章节目录，滚动高亮当前位置
- ✅ **统计数据展示**：首页动态展示博客数据（文章数、项目数等）
- ✅ **技能可视化**：About 页面技能进度条，带动画效果
- ✅ **标签筛选**：文章列表页快速筛选功能
- ✅ **相关文章推荐**：每篇文章底部推荐相关内容
- ✅ **响应式设计**：完美适配手机、平板、桌面

## 项目结构

```text
.
├── index.html                    # 首页
├── about.html                    # 关于页
├── projects.html                 # 项目页
├── posts.html                    # 文章列表页
├── 404.html                      # 404 页面
├── assets/
│   ├── css/
│   │   └── style.css            # 全局样式（包含所有新增样式）
│   └── js/
│       └── main.js              # 交互脚本（包含所有新增功能）
├── posts/                        # 文章目录
│   ├── vps-oracle-singbox.html
│   ├── computer-vision-gaze.html
│   └── thesis-defense.html
├── deploy.sh                     # 一键部署脚本
├── CHANGELOG.md                  # 更新日志
└── README.md                     # 本文件
```

## 本地预览

方式一：直接双击打开 `index.html`。

方式二：在项目根目录启动一个本地静态文件服务：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://127.0.0.1:8080/
```

Windows 环境如果没有 `python3` 命令，可以尝试：

```powershell
python -m http.server 8080
```

## 部署到 Nginx

目标部署目录：

```text
/var/www/blog
```

### 方式一：使用一键部署脚本（推荐）

1. **编辑部署脚本**：

```bash
# 编辑 deploy.sh，修改以下配置
VPS_USER="root"              # 你的 VPS 用户名
VPS_HOST="your-vps-ip"       # 你的 VPS IP 地址
VPS_PATH="/var/www/blog"     # 博客部署路径
```

2. **执行部署**：

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- ✓ 检查本地文件
- ✓ 创建远程目录
- ✓ 上传所有文件
- ✓ 设置正确的权限

### 方式二：手动部署

在 VPS 上创建目录并上传文件：

```bash
sudo mkdir -p /var/www/blog
sudo rsync -av --delete ./ /var/www/blog/
sudo chown -R www-data:www-data /var/www/blog
```

当前没有域名时，可以使用公网 IP 访问。Nginx 站点配置示例：

```nginx
server {
    listen 80 default_server;
    server_name _;

    root /var/www/blog;
    index index.html;

    location / {
        try_files $uri $uri/ /404.html;
    }

    error_page 404 /404.html;

    location ~* \.(css|js|png|jpg|jpeg|webp|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

检查并重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

访问：

```text
http://VPS公网IP/
```

## 更新文章

1. 在 `posts/` 目录新增一篇 HTML 文件。
2. 在 `posts.html` 中增加对应文章卡片。
3. 如果希望首页展示，把文章摘要同步添加到 `index.html` 的最新文章区域。

### 文章模板

复制任意现有文章文件，按以下结构修改：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="文章描述">
  <title>文章标题 | Odile's Lab</title>
  <link rel="stylesheet" href="../assets/css/style.css">
  <script src="../assets/js/main.js" defer></script>
</head>
<body data-page="article">
  <!-- 导航栏 -->
  <header class="site-header">...</header>

  <!-- 文章主体 -->
  <main id="main" class="article-shell">
    <div class="container article-with-sidebar">
      <article class="article-layout">
        <header class="article-header">
          <a class="back-link" href="../posts.html">← 返回文章列表</a>
          <div class="article-meta">
            <time datetime="2026-06-06">2026-06-06</time>
            <span>分类标签</span>
          </div>
          <h1>文章标题</h1>
          <p>文章摘要</p>
        </header>

        <div class="article-content">
          <h2>章节标题</h2>
          <p>正文内容...</p>
        </div>

        <!-- 相关文章推荐 -->
        <div class="related-posts">
          <h2>相关文章</h2>
          <div class="related-grid">
            <!-- 2篇相关文章卡片 -->
          </div>
        </div>
      </article>

      <!-- 文章目录（自动生成） -->
      <aside class="toc-wrapper" data-toc>
        <h3>目录</h3>
      </aside>
    </div>
  </main>

  <!-- 页脚 -->
  <footer class="site-footer">...</footer>
  
  <!-- 返回顶部按钮 -->
  <button class="back-to-top" type="button" aria-label="返回顶部" data-back-to-top>↑</button>
</body>
</html>
```

### 更新统计数据

编辑 `index.html`，修改统计卡片的 `data-stat` 值：

```html
<span class="stat-value" data-stat="24">0</span>  <!-- 修改数字 24 -->
```

### 调整技能进度

编辑 `about.html`，修改进度条宽度：

```html
<div class="skill-bar"><span style="width: 90%"></span></div>
<span class="skill-percent">90%</span>
```

## 安全说明

- 不包含后台登录入口。
- 不包含表单提交到服务器。
- 不暴露隐私邮箱。
- 外部链接使用 `rel="noopener noreferrer"`。
- 所有内部路径都使用相对路径，便于放到任意静态目录部署。
