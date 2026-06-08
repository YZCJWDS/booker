# 博客部署完整指南

## 🚀 快速开始

### 方式一：使用部署脚本（推荐）

1. **首次部署**

```bash
chmod +x deploy.sh
./deploy.sh
```

脚本会引导你输入：
- VPS 用户名（默认：root）
- VPS IP 地址
- 部署路径（默认：/var/www/blog）

配置会自动保存到 `.deploy-config`，下次部署直接使用。

2. **后续部署**

直接运行即可，使用已保存的配置：
```bash
./deploy.sh
```

### 方式二：手动部署

```bash
# 1. 连接 VPS
ssh root@你的IP

# 2. 创建目录
sudo mkdir -p /var/www/blog

# 3. 本地上传（在项目目录执行）
rsync -avz --delete ./ root@你的IP:/var/www/blog/

# 4. 设置权限
ssh root@你的IP "chown -R www-data:www-data /var/www/blog"
```

## 📁 背景图片配置

### 添加背景图片

1. 将图片放到 `assets/images/backgrounds/` 目录
2. 编辑 `assets/config/backgrounds.css`：

```css
body[data-page="home"] {
  --bg-image-url: url('../images/backgrounds/你的图片.jpg');
  background-image: var(--bg-image-url);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
```

### 推荐图片规格

- **尺寸**：1920x1080 或更大
- **格式**：JPG（照片）/ PNG（插画）
- **大小**：< 500KB（优化后）
- **风格**：柔和、清新、不抢内容焦点

### AI 生图提示词

#### 首页背景
```
soft gradient background, sky blue to mint green, abstract geometric shapes,
watercolor style, dreamy atmosphere, pastel colors, minimalist,
ultra-wide, 1920x1080, high quality
```

#### 关于页背景
```
cozy workspace illustration, coffee cup, books, small plant,
warm lighting, pastel colors, soft shadows, minimalist style,
top view, flat lay, 1920x1080
```

#### 相册页背景
```
photo wall background, polaroid frames, soft beige background,
hanging photos, fairy lights, warm atmosphere, aesthetic,
minimalist, 1920x1080
```

#### 生活页背景
```
lifestyle illustration, travel elements, food and drinks,
music notes, books, plants, pastel colors, hand-drawn style,
whimsical, cheerful, 1920x1080
```

## 🖼️ 照片墙配置

### 添加真实照片

1. 将照片放到 `assets/images/gallery/` 目录
2. 编辑 `gallery.html`，替换占位卡片：

```html
<div class="photo-card" data-category="life">
  <img src="./assets/images/gallery/photo-1.jpg" alt="描述">
  <div class="photo-caption">
    <p style="font-size: 14px; font-weight: 600;">照片标题</p>
    <p style="font-size: 12px; opacity: 0.9;">2026-06-06</p>
  </div>
</div>
```

## 📝 添加新文章

### 1. 创建文章文件

在 `posts/tech/`（技术）、`posts/life/`（生活）或 `posts/notes/`（笔记）目录下创建 HTML 文件。

### 2. 使用文章模板

复制现有文章，修改以下部分：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <title>文章标题 | Odile's Lab</title>
  <link rel="stylesheet" href="../../assets/css/style-new.css">
  <link rel="stylesheet" href="../../assets/css/animations.css">
  <link rel="stylesheet" href="../../assets/config/backgrounds.css">
  <script src="../../assets/js/main.js" defer></script>
</head>
<body data-page="article">
  <!-- 内容 -->
</body>
</html>
```

### 3. 更新首页和归档

- 在 `index-new.html` 的"最近更新"区域添加卡片
- 在 `archive.html` 的时间线中添加条目

## 🎨 自定义配色

编辑 `assets/css/style-new.css` 中的 CSS 变量：

```css
:root {
  --sky-blue: #87CEEB;
  --mint-green: #98D8C8;
  --coral-pink: #FF6B6B;
  /* ...更多颜色 */
}
```

## 🔗 友链管理

编辑 `friends.html`，添加友链卡片：

```html
<a href="https://example.com" class="friend-card" target="_blank" rel="noopener noreferrer">
  <div class="friend-avatar">X</div>
  <div class="friend-info">
    <div class="friend-name">友站名称</div>
    <div class="friend-desc">友站简介</div>
    <div class="friend-link">
      <svg style="width: 14px; height: 14px;">
        <use href="./assets/images/decorations/icons.svg#icon-link"/>
      </svg>
      example.com
    </div>
  </div>
</a>
```

## 🛠️ Nginx 配置

创建 `/etc/nginx/sites-available/blog`：

```nginx
server {
    listen 80 default_server;
    server_name _;

    root /var/www/blog;
    index index-new.html index.html;

    location / {
        try_files $uri $uri/ /404.html;
    }

    error_page 404 /404.html;

    location ~* \.(css|js|png|jpg|jpeg|webp|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    # 支持 SVG
    location ~* \.svg$ {
        add_header Content-Type image/svg+xml;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📌 注意事项

1. **首次部署后**：
   - 访问 `http://你的IP/index-new.html` 查看新版本
   - 确认无误后，将 `index-new.html` 重命名为 `index.html`

2. **配置文件安全**：
   - `.deploy-config` 包含敏感信息，不要提交到 Git
   - 已在 `.gitignore` 中排除（需要创建）

3. **文件权限**：
   - 确保 VPS 上文件属于 www-data 用户
   - `sudo chown -R www-data:www-data /var/www/blog`

## 🆘 常见问题

### Q: 背景图片不显示？
A: 检查图片路径和 CSS 语法，确保取消了注释

### Q: SVG 图标不显示？
A: 确保 `icons.svg` 路径正确，检查浏览器控制台错误

### Q: 部署后样式错乱？
A: 检查 CSS 文件引用路径，清除浏览器缓存

### Q: deploy.sh 无法执行？
A: 运行 `chmod +x deploy.sh` 赋予执行权限

## 📚 更多资源

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [CSS 渐变生成器](https://cssgradient.io/)
- [SVG 图标库](https://www.svgrepo.com/)
- [图片压缩工具](https://tinypng.com/)

---

遇到问题？在 GitHub 提 Issue：https://github.com/YZCJWDS
