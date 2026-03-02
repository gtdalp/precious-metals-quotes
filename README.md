# 贵金属行情中心

一个美观、实时的贵金属与 A 股行情展示网页。

## ✨ 功能特性

- 💰 **贵金属实时价格**: 黄金、白银、铜（USD 计价）
- 📊 **A 股大盘指数**: 上证指数、深证成指、创业板指、沪深 300
- 📈 **贵金属个股**: 山东黄金、紫金矿业、银泰黄金等
- 🔄 **自动刷新**: 每 5 秒更新数据，无需手动刷新
- 🎨 **美观设计**: 深色主题、卡片布局、响应式设计
- 📱 **移动端适配**: 支持手机、平板、桌面端

## 🚀 快速开始

### 本地预览

```bash
# 进入 assets 目录
cd assets

# 启动本地服务器
python -m http.server 8080

# 访问 http://localhost:8080
```

### 部署到 GitHub Pages

```bash
# 运行部署脚本
python scripts/deploy.py
```

详细部署步骤请参考 [DEPLOY.md](DEPLOY.md)

## 📁 文件结构

```
precious-metals-quotes/
├── assets/
│   ├── index.html    # 主页面
│   └── app.js        # 数据获取与渲染
├── scripts/
│   └── deploy.py     # GitHub 部署脚本
├── SKILL.md          # Skill 说明文档
└── DEPLOY.md         # 部署指南
```

## ⚙️ 自定义配置

编辑 `assets/app.js`:

```javascript
// 修改刷新间隔（毫秒）
const REFRESH_INTERVAL = 5000;

// 修改股票列表
const STOCK_CONFIG = {
    indices: [...],  // 大盘指数
    stocks: [...]    // 个股列表
};
```

## 📊 数据源

- **贵金属**: Gold API (https://api.gold-api.com/)
- **A 股**: 模拟数据（演示用途）

## 🛠️ 技术栈

- HTML5
- CSS3 (Flexbox, Grid, 动画)
- 原生 JavaScript (ES6+)
- Fetch API

## 📝 注意事项

1. 免费 API 可能有请求频率限制
2. A 股数据仅在交易时段有效
3. 首次部署 GitHub Pages 需 1-2 分钟生效

## 📄 许可证

MIT License
