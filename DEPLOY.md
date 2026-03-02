# 贵金属行情网页 - 快速部署指南

## 方法一：自动部署（推荐）

### 前提条件
1. 已安装 Git
2. 已安装 GitHub CLI (`gh`)
   - Windows: `winget install GitHub.cli`
   - Mac: `brew install gh`
   - Linux: `sudo apt install gh`

### 部署步骤

1. **登录 GitHub**
   ```bash
   gh auth login
   ```

2. **运行部署脚本**
   ```bash
   cd skills/public/precious-metals-quotes
   python scripts/deploy.py
   ```

3. **获取访问链接**
   - 脚本会输出 GitHub 仓库地址
   - 脚本会输出 GitHub Pages 访问链接

## 方法二：手动部署

### 步骤 1：复制网页文件

将 `assets/` 目录中的文件复制到任意位置：
```
index.html
app.js
```

### 步骤 2：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名：`precious-metals-quotes`
3. 描述：贵金属行情中心
4. 选择 **Public**
5. 点击 **Create repository**

### 步骤 3：推送文件

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/precious-metals-quotes.git
cd precious-metals-quotes

# 复制网页文件到仓库目录
cp path/to/assets/index.html .
cp path/to/assets/app.js .

# 提交并推送
git add .
git commit -m "Deploy precious metals quotes page"
git push -u origin main

# 创建 gh-pages 分支
git checkout -b gh-pages
git push -u origin gh-pages
git checkout main
```

### 步骤 4：启用 GitHub Pages

1. 访问：https://github.com/YOUR_USERNAME/precious-metals-quotes/settings/pages
2. Source 选择：**Deploy from a branch**
3. Branch 选择：**gh-pages** / **/** (根目录)
4. 点击 **Save**

### 步骤 5：访问页面

等待 1-2 分钟后，访问：
```
https://YOUR_USERNAME.github.io/precious-metals-quotes/
```

## 本地测试

直接双击打开 `index.html` 文件即可在浏览器中预览。

或使用本地服务器：
```bash
# Python 3
python -m http.server 8000

# 然后访问 http://localhost:8000
```

## 自定义配置

编辑 `app.js` 文件：

### 修改刷新间隔
```javascript
// 默认 5 秒
const REFRESH_INTERVAL = 5000;  // 单位：毫秒
```

### 修改股票列表
```javascript
const STOCK_CONFIG = {
    indices: [
        { code: '000001', name: '上证指数', symbol: 'SH' },
        // 添加更多指数...
    ],
    stocks: [
        { code: '600547', name: '山东黄金', symbol: 'SH' },
        // 添加更多股票...
    ]
};
```

## 数据源说明

### 贵金属数据
- **黄金/白银**: 使用 `https://api.gold-api.com/` 免费 API
- **铜**: 当前为模拟数据

### A 股数据
- 当前版本使用模拟数据（演示用途）
- 实际部署建议接入新浪财经 API 或腾讯财经 API

## 常见问题

### Q: 页面不显示数据？
A: 检查浏览器控制台是否有错误，确认网络连接正常。

### Q: GitHub Pages 访问 404？
A: 等待 1-2 分钟让 GitHub 构建完成，确认已正确启用 Pages。

### Q: 数据不更新？
A: 检查 API 是否可用，或查看浏览器控制台的错误信息。

## 技术支持

如有问题，请查看：
- [GitHub Pages 官方文档](https://pages.github.com/)
- [Gold API 文档](https://www.goldapi.io/)
