# 博客优化更新日志

## 2026-06-06 重大美化更新

### 🎨 视觉增强

#### 1. 新增组件
- **阅读进度条**：文章页顶部会显示阅读进度
- **代码复制按钮**：鼠标悬停在代码块上会显示"Copy"按钮，点击即可复制代码
- **统计卡片**：首页新增博客数据展示，包含文章数、项目数、代码提交数和 VPS 在线率
- **技能可视化**：About 页面的技术栈从标签改为进度条展示，更直观
- **文章目录（TOC）**：所有文章页右侧新增目录导航，点击可跳转到对应章节
- **相关文章推荐**：每篇文章底部推荐 2 篇相关文章

#### 2. 交互优化
- **标签筛选**：文章列表页新增标签快速筛选按钮（全部/VPS/Computer Vision/Gaze/Thesis/AI Tools）
- **平滑动画**：统计数字从 0 开始动态增长到目标值
- **技能条动画**：About 页面的技能进度条有填充动画效果
- **活跃目录高亮**：滚动文章时，目录会自动高亮当前阅读的章节

### 📝 内容完善

#### 文章内容扩充
- **thesis-defense.html**：
  - 新增"时间分配建议"章节
  - 新增"后续复盘"章节
  - 内容更加完整和实用

#### 页面布局优化
- 所有文章页采用新的侧边栏布局（内容 + 目录）
- 文章底部添加相关文章推荐区域
- 移动端自动调整为单列布局

### 🛠️ 技术改进

#### CSS 新增样式类
```css
.reading-progress          /* 阅读进度条 */
.code-block-wrapper        /* 代码块容器 */
.copy-code-btn            /* 复制按钮 */
.toc-wrapper              /* 目录容器 */
.toc-list                 /* 目录列表 */
.stats-grid               /* 统计网格 */
.stat-card                /* 统计卡片 */
.skill-radar              /* 技能雷达 */
.skill-bar-item           /* 技能条项 */
.tag-filter-bar           /* 标签筛选栏 */
.tag-filter-btn           /* 筛选按钮 */
.related-posts            /* 相关文章 */
.related-grid             /* 相关文章网格 */
.article-with-sidebar     /* 文章侧边栏布局 */
```

#### JavaScript 新增功能
```javascript
setupReadingProgress()    // 阅读进度跟踪
setupCodeCopy()          // 代码复制功能
setupTOC()               // 目录生成和高亮
setupTagFilter()         // 标签筛选逻辑
animateStats()           // 统计数字动画
```

### 📱 响应式优化

#### 移动端适配
- 统计卡片在小屏幕下改为 2 列，更小屏幕改为 1 列
- 文章侧边栏在平板以下设备自动折叠到顶部
- 技能条在移动端调整间距和字体大小
- 标签筛选栏自动换行适应小屏幕

### 🎯 用户体验提升

1. **首页**：
   - 新增统计数据，让访客快速了解博客规模
   - 统计数字有动画效果，更有科技感

2. **About 页**：
   - 技能展示从标签改为进度条
   - 清晰展示各技能熟练程度
   - 进度条有填充动画

3. **文章列表页**：
   - 顶部新增标签快速筛选
   - 点击标签可快速过滤相关文章
   - 保留原有搜索功能

4. **文章详情页**：
   - 右侧自动生成目录导航
   - 滚动时高亮当前章节
   - 代码块可一键复制
   - 阅读进度条实时显示
   - 底部推荐相关文章

### 🚀 性能优化

- 所有动画使用 CSS transform，性能更好
- 使用 Intersection Observer API 实现统计数字动画
- 滚动事件使用 passive 监听，提升滚动流畅度
- 代码高效，无外部依赖

### 🔧 兼容性

- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- Clipboard API 兼容性处理（复制失败时显示提示）
- 媒体查询确保移动端完美显示
- 遵循无障碍设计原则

## 使用指南

### 本地预览
```bash
# 方式一：Python HTTP Server
python -m http.server 8080
# 访问 http://localhost:8080

# 方式二：直接打开
# 双击 index.html 即可在浏览器中预览
```

### 部署到 VPS
```bash
# 1. 上传文件到 VPS
rsync -avz --delete ./ user@your-vps:/var/www/blog/

# 2. 设置权限
sudo chown -R www-data:www-data /var/www/blog

# 3. 重载 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### 添加新文章

1. **创建文章文件**：在 `posts/` 目录下创建新的 HTML 文件
2. **使用文章模板**：复制任意现有文章，修改内容
3. **更新文章列表**：在 `posts.html` 中添加文章卡片
4. **更新首页**（可选）：在 `index.html` 最新文章区添加

### 自定义统计数据

编辑 `index.html` 中的统计卡片：
```html
<span class="stat-value" data-stat="24">0</span>
```
修改 `data-stat` 属性值即可改变目标数字。

### 调整技能进度

编辑 `about.html` 中的技能条：
```html
<div class="skill-bar"><span style="width: 90%"></span></div>
<span class="skill-percent">90%</span>
```
修改 `width` 和百分比即可。

## 后续计划

- [ ] 添加深色/浅色主题切换
- [ ] 添加文章搜索高亮显示
- [ ] 添加评论区（可选：使用 GitHub Issues）
- [ ] 添加 RSS 订阅
- [ ] 添加文章字数统计和阅读时长估算
- [ ] 添加更多文章和项目
- [ ] 域名绑定后启用 HTTPS

## 技术栈

- **HTML5**：语义化标签，无障碍设计
- **CSS3**：Grid、Flexbox、CSS Variables、Animations
- **原生 JavaScript**：ES6+，无框架，无依赖
- **响应式设计**：移动优先，适配所有设备
- **深蓝科技风**：专业、简洁、有未来感

## 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## License

个人博客项目，仅供学习和个人使用。
