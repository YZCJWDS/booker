# 背景图片配置指南

## 📁 目录说明

将你的背景图片放到这个文件夹，然后通过配置文件引用。

当前首页已经内置一张轻量示例背景：`home-paper-wash.webp`。如果想替换为自己的图片，只需要在 `assets/config/backgrounds.css` 中修改对应页面的 `--bg-image-url`。

## 🎨 使用方式

### 方式1：修改配置文件（推荐）

编辑 `assets/config/backgrounds.css`：

```css
/* 首页背景 */
body[data-page="home"] {
  --bg-image-url: url('../images/backgrounds/home-bg.jpg');
}

/* 关于页背景 */
body[data-page="about"] {
  --bg-image-url: url('../images/backgrounds/about-bg.jpg');
}
```

### 方式2：直接在HTML中设置

在 `<body>` 标签上添加样式：

```html
<body data-page="home" style="--bg-image-url: url('./assets/images/backgrounds/home-bg.jpg')">
```

## 📐 图片规格建议

| 属性 | 推荐值 |
|------|--------|
| 尺寸 | 1920x1080 或更大 |
| 格式 | JPG（照片）/ PNG（插画，需要透明）/ WebP（现代浏览器）|
| 文件大小 | < 500KB（压缩优化后）|
| 风格 | 柔和、清新、不抢内容焦点 |

## 🖼️ 各页面背景建议

### home-bg.jpg - 首页背景
- **风格**：抽象渐变 + 柔和几何图形
- **色调**：天空蓝到薄荷绿渐变
- **参考**：水彩晕染、云朵、轻盈感

### about-bg.jpg - 关于页背景
- **风格**：个人插画或艺术化照片
- **色调**：温暖、柔和
- **参考**：书桌、咖啡、植物

### gallery-bg.jpg - 相册页背景
- **风格**：相框、照片墙元素
- **色调**：柔和中性
- **参考**：拍立得、胶片质感

### life-bg.jpg - 生活页背景
- **风格**：生活场景插画
- **色调**：明亮、活泼
- **参考**：旅行、美食、日常

### posts-bg.jpg - 文章页背景
- **风格**：简约、纹理感
- **色调**：清爽、不干扰阅读
- **参考**：纸张纹理、笔记本

## 🤖 AI生图提示词（供参考）

### 首页背景
```
soft gradient background, sky blue to mint green, abstract geometric shapes, 
watercolor style, dreamy atmosphere, pastel colors, minimalist, 
ultra-wide, 1920x1080, high quality
```

### 关于页背景
```
cozy workspace illustration, coffee cup, books, small plant, 
warm lighting, pastel colors, soft shadows, minimalist style, 
top view, flat lay, 1920x1080
```

### 相册页背景
```
photo wall background, polaroid frames, soft beige background, 
hanging photos, fairy lights, warm atmosphere, aesthetic, 
minimalist, 1920x1080
```

### 生活页背景
```
lifestyle illustration, travel elements, food and drinks, 
music notes, books, plants, pastel colors, hand-drawn style, 
whimsical, cheerful, 1920x1080
```

### 文章页背景
```
subtle paper texture, light cream color, minimal noise, 
clean background, slightly warm tone, notebook style, 
1920x1080, seamless
```

## 💡 提示

- 如果不使用背景图片，系统会自动使用CSS渐变背景
- 建议使用图片压缩工具（如 TinyPNG）优化文件大小
- 可以为不同页面设置不同背景，营造不同氛围
- 背景图片应避免过于复杂，以免影响内容阅读

## 🔄 临时背景方案

在准备好图片之前，系统使用以下CSS渐变作为临时背景：

- **首页**：天空蓝到薄荷绿的对角线渐变
- **关于页**：奶白到浅蓝的柔和渐变
- **相册页**：珊瑚粉到柠檬黄的温暖渐变
- **生活页**：薰衣草紫到薄荷绿的梦幻渐变
- **文章页**：纯净奶白背景
