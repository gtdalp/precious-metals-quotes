---
name: precious-metals-quotes
description: 生成贵金属行情网页，包含黄金、白银、铜的实时价格（USD 计价）和 A 股大盘指数及贵金属个股展示。使用纯原生 JS+HTML 开发，支持 5 秒自动刷新、局部数据更新。适用于快速部署 GitHub Pages 展示实时金融数据。
---

# 贵金属行情网页生成器

本 Skill 用于生成一个美观、实时的贵金属行情展示网页，包含贵金属价格和 A 股相关数据。

## 功能特性

- **纯原生技术栈**：无需框架，仅使用 HTML + CSS + JavaScript
- **实时数据展示**：
  - 贵金属：黄金、白银、铜（USD 计价）
  - A 股：大盘指数 + 贵金属相关个股
- **智能刷新**：
  - 自动刷新：每 5 秒更新一次
  - 局部刷新：仅更新数据区域，不刷新整个页面
  - 手动刷新：右下角悬浮按钮
- **美观设计**：
  - 深色渐变背景
  - 卡片式布局
  - 响应式设计，支持移动端
  - 涨跌颜色标识（绿涨红跌）

## 使用方式

### 1. 生成网页

运行部署脚本自动生成网页文件：

```bash
python scripts/deploy.py
```

### 2. 部署到 GitHub Pages

脚本会自动：
1. 创建 GitHub 仓库（如果不存在）
2. 推送网页文件到 `main` 分支
3. 启用 GitHub Pages
4. 返回仓库地址和访问链接

### 3. 自定义配置

如需修改配置，编辑 `assets/app.js`：

```javascript
// 修改刷新间隔（毫秒）
const REFRESH_INTERVAL = 5000;

// 修改股票列表
const STOCK_CONFIG = {
    indices: [...],  // 大盘指数
    stocks: [...]    // 个股列表
};
```

## 数据源说明

### 贵金属数据
- **黄金/白银**：使用 `https://api.gold-api.com/` 免费 API
- **铜**：当前为模拟数据，实际部署需替换为 LME 或 COMEX 真实 API

### A 股数据
- 当前版本使用模拟数据（演示用途）
- 实际部署建议接入：
  - 新浪财经 API：`https://hq.sinajs.cn/`
  - 腾讯财经 API
  - 或购买专业金融数据服务

## 文件结构

```
precious-metals-quotes/
├── SKILL.md              # 技能说明文档
├── assets/
│   ├── index.html        # 主页面
│   └── app.js            # 数据获取与渲染逻辑
└── scripts/
    └── deploy.py         # GitHub 部署脚本
```

## 注意事项

1. **API 限制**：免费 API 可能有请求频率限制，生产环境建议使用付费服务
2. **数据准确性**：模拟数据仅用于演示，实际使用需接入真实数据源
3. **时区处理**：A 股数据仅在交易时段有效（工作日 9:30-15:00）
4. **CORS 问题**：部分 API 可能存在跨域限制，必要时需配置代理

## 扩展建议

- 添加更多贵金属品种（铂金、钯金等）
- 增加历史价格图表（使用 Chart.js）
- 添加价格预警功能
- 支持多语言切换
- 添加数据导出功能

## 故障排除

### 数据不更新
1. 检查浏览器控制台是否有错误
2. 确认 API 服务可用
3. 检查网络连接

### 页面显示异常
1. 清除浏览器缓存
2. 确认使用现代浏览器（Chrome/Firefox/Edge）
3. 检查 JavaScript 是否启用

## 相关资源

- [Gold API 文档](https://www.goldapi.io/)
- [GitHub Pages 官方文档](https://pages.github.com/)
- [新浪财经 API 参考](https://finance.sina.com.cn/)
