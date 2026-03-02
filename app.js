// 贵金属行情中心 - 主应用程序
// 数据源配置
const DATA_SOURCES = {
    // 贵金属数据 - 使用免费 API
    PRECIOUS_METALS: 'https://api.gold-api.com/price/XAU',
    // 备选：使用 Kitco 或其他免费源
    ALTERNATIVE: 'https://www.goldapi.io/api/XAUUSD'
};

// A 股数据配置（使用模拟数据，实际部署需替换为真实 API）
const STOCK_CONFIG = {
    // 大盘指数
    indices: [
        { code: '000001', name: '上证指数', symbol: 'SH' },
        { code: '399001', name: '深证成指', symbol: 'SZ' },
        { code: '399006', name: '创业板指', symbol: 'SZ' },
        { code: '000300', name: '沪深 300', symbol: 'SH' }
    ],
    // 贵金属相关个股
    stocks: [
        { code: '600547', name: '山东黄金', symbol: 'SH' },
        { code: '601899', name: '紫金矿业', symbol: 'SH' },
        { code: '000975', name: '银泰黄金', symbol: 'SZ' },
        { code: '600988', name: '赤峰黄金', symbol: 'SH' },
        { code: '002155', name: '湖南黄金', symbol: 'SZ' },
        { code: '600489', name: '中金黄金', symbol: 'SH' }
    ]
};

// 刷新间隔（毫秒）
const REFRESH_INTERVAL = 5000;

// 状态管理
let lastUpdateTime = null;
let countdownTimer = null;
let autoRefreshTimer = null;

// 工具函数
const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const updateLastUpdateTime = () => {
    lastUpdateTime = new Date();
    document.getElementById('lastUpdate').textContent = `最后更新：${formatTime(lastUpdateTime)}`;
};

const updateCountdown = () => {
    let secondsLeft = Math.ceil(REFRESH_INTERVAL / 1000);
    
    const updateDisplay = () => {
        document.getElementById('countdown').textContent = `下次刷新：${secondsLeft}s`;
        secondsLeft--;
        
        if (secondsLeft < 0) {
            secondsLeft = Math.ceil(REFRESH_INTERVAL / 1000);
        }
    };
    
    updateDisplay();
    countdownTimer = setInterval(updateDisplay, 1000);
};

// 贵金属数据获取
const fetchPreciousMetals = async () => {
    try {
        // 黄金价格（XAU/USD）
        const goldResponse = await fetch('https://api.gold-api.com/price/XAU');
        const goldData = await goldResponse.json();
        
        // 白银价格（XAG/USD）- 通过 API 获取
        const silverResponse = await fetch('https://api.gold-api.com/price/XAG');
        const silverData = await silverResponse.json();
        
        // 铜价格（使用模拟数据，实际需替换为真实 API）
        const copperPrice = await fetchCopperPrice();
        
        return {
            gold: {
                price: goldData.price,
                timestamp: goldData.timestamp,
                change: calculateChange(goldData.price, goldData.previousClose)
            },
            silver: {
                price: silverData.price,
                timestamp: silverData.timestamp,
                change: calculateChange(silverData.price, silverData.previousClose)
            },
            copper: copperPrice
        };
    } catch (error) {
        console.error('获取贵金属数据失败:', error);
        return null;
    }
};

// 铜价格获取（模拟，实际部署需替换）
const fetchCopperPrice = async () => {
    // 模拟铜价格数据（LME 铜，USD/吨）
    // 实际应使用：https://www.marketwatch.com/investing/future/hg00 或其他商品 API
    const basePrice = 8500;
    const fluctuation = (Math.random() - 0.5) * 200;
    const price = basePrice + fluctuation;
    
    return {
        price: price,
        change: {
            amount: fluctuation,
            percent: (fluctuation / basePrice) * 100
        },
        unit: 'USD/吨'
    };
};

// 计算涨跌
const calculateChange = (current, previous) => {
    const amount = current - previous;
    const percent = (amount / previous) * 100;
    return { amount, percent };
};

// 渲染贵金属卡片
const renderPreciousMetalCard = (metal, data) => {
    const isUp = data.change.percent >= 0;
    const arrow = isUp ? '↑' : '↓';
    const priceClass = isUp ? 'price-up' : 'price-down';
    
    return `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${metal}</span>
                <span class="card-symbol">${data.unit || 'USD/oz'}</span>
            </div>
            <div class="price ${priceClass}">
                $${formatNumber(data.price)}
            </div>
            <div class="change-info">
                <span class="change ${priceClass}">
                    <span class="arrow">${arrow}</span>
                    <span class="change-percent">${formatNumber(Math.abs(data.change.percent))}%</span>
                </span>
                <span class="change ${priceClass}">
                    ${isUp ? '+' : ''}${formatNumber(data.change.amount)}
                </span>
            </div>
        </div>
    `;
};

// 渲染贵金属数据
const renderPreciousMetals = (data) => {
    const grid = document.getElementById('preciousMetalsGrid');
    
    if (!data) {
        grid.innerHTML = '<div class="error">数据加载失败，请稍后重试</div>';
        return;
    }
    
    grid.innerHTML = `
        ${renderPreciousMetalCard('黄金', {
            price: data.gold.price,
            change: data.gold.change,
            unit: 'USD/oz'
        })}
        ${renderPreciousMetalCard('白银', {
            price: data.silver.price,
            change: data.silver.change,
            unit: 'USD/oz'
        })}
        ${renderPreciousMetalCard('铜', {
            price: data.copper.price,
            change: data.copper.change,
            unit: data.copper.unit
        })}
    `;
};

// A 股数据获取（模拟，实际部署需替换为真实 API）
const fetchStockData = async () => {
    // 模拟 A 股数据
    // 实际应使用：https://hq.sinajs.cn/ 或 腾讯财经 API
    
    const generateStockData = (basePrice, volatility = 0.02) => {
        const changePercent = (Math.random() - 0.5) * volatility * 2;
        const changeAmount = basePrice * changePercent;
        const currentPrice = basePrice + changeAmount;
        
        return {
            price: currentPrice,
            change: {
                amount: changeAmount,
                percent: changePercent * 100
            }
        };
    };
    
    // 模拟指数数据
    const indices = STOCK_CONFIG.indices.map(index => ({
        ...index,
        ...generateStockData(
            index.code === '000001' ? 3000 :
            index.code === '399001' ? 9000 :
            index.code === '399006' ? 1800 : 3500,
            0.015
        )
    }));
    
    // 模拟个股数据
    const stocks = STOCK_CONFIG.stocks.map(stock => ({
        ...stock,
        ...generateStockData(
            stock.code === '600547' ? 25 :
            stock.code === '601899' ? 15 :
            stock.code === '000975' ? 12 :
            stock.code === '600988' ? 18 :
            stock.code === '002155' ? 14 : 22,
            0.03
        )
    }));
    
    return { indices, stocks };
};

// 渲染股票卡片
const renderStockCard = (stock) => {
    const isUp = stock.change.percent >= 0;
    const arrow = isUp ? '↑' : '↓';
    const priceClass = isUp ? 'price-up' : 'price-down';
    
    return `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${stock.name}</span>
                <span class="card-symbol">${stock.code}</span>
            </div>
            <div class="price ${priceClass}">
                ¥${formatNumber(stock.price, 2)}
            </div>
            <div class="change-info">
                <span class="change ${priceClass}">
                    <span class="arrow">${arrow}</span>
                    <span class="change-percent">${formatNumber(Math.abs(stock.change.percent))}%</span>
                </span>
                <span class="change ${priceClass}">
                    ${stock.change.amount >= 0 ? '+' : ''}${formatNumber(stock.change.amount, 2)}
                </span>
            </div>
        </div>
    `;
};

// 渲染 A 股数据
const renderStockData = (data) => {
    // 渲染大盘指数
    const indexGrid = document.getElementById('stockIndexGrid');
    indexGrid.innerHTML = data.indices.map(index => renderStockCard(index)).join('');
    
    // 渲染个股
    const stockGrid = document.getElementById('stockGrid');
    stockGrid.innerHTML = data.stocks.map(stock => renderStockCard(stock)).join('');
};

// 主刷新函数
const refreshAll = async () => {
    console.log('刷新数据...');
    
    // 获取贵金属数据
    const preciousMetals = await fetchPreciousMetals();
    renderPreciousMetals(preciousMetals);
    
    // 获取 A 股数据
    const stockData = await fetchStockData();
    renderStockData(stockData);
    
    // 更新时间
    updateLastUpdateTime();
};

// 初始化
const init = () => {
    // 立即刷新一次
    refreshAll();
    
    // 启动倒计时
    updateCountdown();
    
    // 设置自动刷新
    autoRefreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
    
    // 绑定手动刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', () => {
        refreshAll();
        // 重置倒计时
        clearInterval(countdownTimer);
        updateCountdown();
    });
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停刷新
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        if (countdownTimer) clearInterval(countdownTimer);
    } else {
        // 页面显示时恢复刷新
        refreshAll();
        updateCountdown();
        autoRefreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
    }
});
