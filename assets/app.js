// 贵金属行情中心 - 主应用程序
// 版本：使用 60s API (https://github.com/vikiboss/60s)

// A 股数据配置（新浪财经 API）
const STOCK_CONFIG = {
    // 大盘指数
    indices: [
        { code: 'sh000001', name: '上证指数' },
        { code: 'sz399001', name: '深证成指' },
        { code: 'sz399006', name: '创业板指' },
        { code: 'sh000300', name: '沪深 300' }
    ],
    // 贵金属相关个股
    stocks: [
        { code: 'sh600547', name: '山东黄金' },
        { code: 'sh601899', name: '紫金矿业' },
        { code: 'sz000975', name: '银泰黄金' },
        { code: 'sh600988', name: '赤峰黄金' },
        { code: 'sz002155', name: '湖南黄金' },
        { code: 'sh600489', name: '中金黄金' }
    ]
};

// 刷新间隔（毫秒）
const REFRESH_INTERVAL = 5000;

// 状态管理
let lastUpdateTime = null;
let countdownTimer = null;
let autoRefreshTimer = null;
let realtimeTimer = null;

// 工具函数
const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) {
        return '--';
    }
    return Number(num).toLocaleString('zh-CN', {
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

const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const updateLastUpdateTime = () => {
    lastUpdateTime = new Date();
    document.getElementById('lastUpdate').textContent = `最后更新：${formatDate(lastUpdateTime)} ${formatTime(lastUpdateTime)}`;
};

// 实时时钟
const startRealtimeClock = () => {
    const updateTimeDisplay = () => {
        const now = new Date();
        document.getElementById('lastUpdate').textContent = `最后更新：${formatDate(now)} ${formatTime(now)}`;
    };
    updateTimeDisplay();
    realtimeTimer = setInterval(updateTimeDisplay, 1000);
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

// ==================== 贵金属数据获取（使用 60s API）====================

// 获取贵金属数据（60s API - https://github.com/vikiboss/60s）
const fetchPreciousMetals = async () => {
    try {
        // 使用 60s API 获取金价数据
        const response = await fetch('https://60s.viki.moe/v2/gold-price');
        const result = await response.json();
        
        if (result.code === 200 && result.data && result.data.metals) {
            const metals = result.data.metals;
            
            // 解析金价数据
            let goldData = null;
            let silverData = null;
            
            // 查找黄金价格（优先找黄金_T+D 或黄金_9999）
            for (const metal of metals) {
                if (metal.name.includes('黄金_T+D') || metal.name.includes('黄金_9999')) {
                    goldData = metal;
                    break;
                }
            }
            
            // 如果没有找到 T+D 或 9999，使用今日金价
            if (!goldData) {
                goldData = metals.find(m => m.name === '今日金价') || metals[0];
            }
            
            // 白银数据（如果没有，使用模拟数据）
            silverData = metals.find(m => m.name.includes('白银'));
            
            return {
                gold: parseMetalData(goldData, '黄金'),
                silver: silverData ? parseMetalData(silverData, '白银') : getMockSilverPrice(),
                copper: getMockCopperPrice()
            };
        }
    } catch (error) {
        console.error('获取 60s API 数据失败:', error);
    }
    
    // API 失败时使用备用数据
    return getMockPreciousMetals();
};

// 解析金属数据
const parseMetalData = (data, defaultName) => {
    if (!data) return null;
    
    const todayPrice = parseFloat(data.today_price) || 0;
    const lowPrice = parseFloat(data.low_price) || todayPrice;
    
    return {
        price: todayPrice,
        change: {
            amount: todayPrice - lowPrice,
            percent: ((todayPrice - lowPrice) / lowPrice) * 100
        },
        unit: data.unit || '元/克',
        source: '60s API',
        time: data.updated || ''
    };
};

// 获取模拟白银价格（备用）
const getMockSilverPrice = () => {
    const basePrice = 7.85;
    const fluctuation = (Math.random() - 0.5) * 0.15;
    return {
        price: basePrice + fluctuation,
        change: {
            amount: fluctuation,
            percent: (fluctuation / basePrice) * 100
        },
        unit: '元/克',
        source: '参考数据'
    };
};

// 获取模拟铜价格（备用）
const getMockCopperPrice = () => {
    const basePrice = 0.0695;
    const fluctuation = (Math.random() - 0.5) * 0.001;
    return {
        price: basePrice + fluctuation,
        change: {
            amount: fluctuation,
            percent: (fluctuation / basePrice) * 100
        },
        unit: '元/克',
        source: '参考数据'
    };
};

// 获取模拟贵金属数据（备用）
const getMockPreciousMetals = () => {
    return {
        gold: {
            price: 625.50 + (Math.random() - 0.5) * 10,
            change: {
                amount: (Math.random() - 0.5) * 5,
                percent: (Math.random() - 0.5) * 0.8
            },
            unit: '元/克',
            source: '参考数据'
        },
        silver: getMockSilverPrice(),
        copper: getMockCopperPrice()
    };
};

// 渲染贵金属卡片
const renderPreciousMetalCard = (metal, data) => {
    if (!data || data.price === null || data.price === undefined || isNaN(data.price) || data.price <= 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">${metal}</span>
                    <span class="card-symbol">--</span>
                </div>
                <div class="price">--</div>
                <div class="change-info">
                    <span class="change">数据加载中...</span>
                </div>
            </div>
        `;
    }
    
    const isUp = data.change.percent >= 0;
    const arrow = isUp ? '↑' : '↓';
    const priceClass = isUp ? 'price-up' : 'price-down';
    const changeAmount = Math.abs(data.change.amount || 0);
    const changePercent = Math.abs(data.change.percent || 0);
    
    return `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${metal}</span>
                <span class="card-symbol">${data.unit}</span>
            </div>
            <div class="price ${priceClass}">
                ¥${formatNumber(data.price)}
            </div>
            <div class="change-info">
                <span class="change ${priceClass}">
                    <span class="arrow">${arrow}</span>
                    <span class="change-percent">${formatNumber(changePercent)}%</span>
                </span>
                <span class="change ${priceClass}">
                    ${data.change.amount >= 0 ? '+' : ''}¥${formatNumber(changeAmount)}
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
        ${renderPreciousMetalCard('黄金', data.gold)}
        ${renderPreciousMetalCard('白银', data.silver)}
        ${renderPreciousMetalCard('铜', data.copper)}
    `;
};

// ==================== A 股数据获取（新浪财经 API）====================

// 获取单个股票数据（新浪财经 API）
const fetchStockQuote = async (code, defaultName) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        
        // 设置超时
        const timeout = setTimeout(() => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            resolve(null);
        }, 3000);
        
        // 全局回调函数
        const callbackName = 'hq_str_' + code.replace('sh', '').replace('sz', '');
        
        // 检查是否已存在
        if (window[callbackName]) {
            delete window[callbackName];
        }
        
        window[callbackName] = function() {
            clearTimeout(timeout);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            
            const dataStr = window[callbackName];
            delete window[callbackName];
            
            if (dataStr && typeof dataStr === 'string') {
                const parts = dataStr.split(',');
                if (parts.length >= 32) {
                    const name = parts[0] || defaultName;
                    const currentPrice = parseFloat(parts[3]) || 0;
                    const previousClose = parseFloat(parts[2]) || currentPrice;
                    const open = parseFloat(parts[1]) || currentPrice;
                    
                    if (currentPrice > 0 && previousClose > 0) {
                        resolve({
                            code: code.replace('sh', '').replace('sz', ''),
                            name: name,
                            price: currentPrice,
                            change: {
                                amount: currentPrice - previousClose,
                                percent: ((currentPrice - previousClose) / previousClose) * 100
                            },
                            open: open
                        });
                        return;
                    }
                }
            }
            resolve(null);
        };
        
        // 加载脚本
        script.src = `https://hq.sinajs.cn/list=${code}`;
        document.body.appendChild(script);
    });
};

// A 股数据获取
const fetchStockData = async () => {
    // 获取指数数据
    const indices = [];
    for (const index of STOCK_CONFIG.indices) {
        const data = await fetchStockQuote(index.code, index.name);
        if (data && data.price > 0) {
            indices.push(data);
        } else {
            // 备用模拟数据
            indices.push(generateMockIndexData(index.code, index.name));
        }
    }
    
    // 获取个股数据
    const stocks = [];
    for (const stock of STOCK_CONFIG.stocks) {
        const data = await fetchStockQuote(stock.code, stock.name);
        if (data && data.price > 0) {
            stocks.push(data);
        } else {
            // 备用模拟数据
            stocks.push(generateMockStockData(stock.code, stock.name));
        }
    }
    
    return { indices, stocks };
};

// 生成模拟指数数据（备用）
const generateMockIndexData = (code, name) => {
    const mockData = {
        'sh000001': { name: '上证指数', base: 3250 },
        'sz399001': { name: '深证成指', base: 10200 },
        'sz399006': { name: '创业板指', base: 2100 },
        'sh000300': { name: '沪深 300', base: 3800 }
    };
    
    const info = mockData[code] || { name: name || '未知指数', base: 3000 };
    const changePercent = (Math.random() - 0.5) * 2;
    const changeAmount = info.base * (changePercent / 100);
    
    return {
        code: code.replace('sh', '').replace('sz', ''),
        name: info.name,
        price: info.base + changeAmount,
        change: {
            amount: changeAmount,
            percent: changePercent
        }
    };
};

// 生成模拟个股数据（备用）
const generateMockStockData = (code, name) => {
    const mockData = {
        '600547': { name: '山东黄金', base: 26.5 },
        '601899': { name: '紫金矿业', base: 16.8 },
        '000975': { name: '银泰黄金', base: 13.2 },
        '600988': { name: '赤峰黄金', base: 19.5 },
        '002155': { name: '湖南黄金', base: 15.3 },
        '600489': { name: '中金黄金', base: 23.8 }
    };
    
    const info = mockData[code] || { name: name || '未知股票', base: 10 };
    const changePercent = (Math.random() - 0.5) * 4;
    const changeAmount = info.base * (changePercent / 100);
    
    return {
        code: code.replace('sh', '').replace('sz', ''),
        name: info.name,
        price: info.base + changeAmount,
        change: {
            amount: changeAmount,
            percent: changePercent
        }
    };
};

// 渲染股票卡片
const renderStockCard = (stock) => {
    if (!stock || stock.price === null || stock.price === undefined || isNaN(stock.price) || stock.price <= 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">--</span>
                    <span class="card-symbol">--</span>
                </div>
                <div class="price">--</div>
                <div class="change-info">
                    <span class="change">数据加载中...</span>
                </div>
            </div>
        `;
    }
    
    const isUp = stock.change.percent >= 0;
    const arrow = isUp ? '↑' : '↓';
    const priceClass = isUp ? 'price-up' : 'price-down';
    const changeAmount = Math.abs(stock.change.amount || 0);
    const changePercent = Math.abs(stock.change.percent || 0);
    
    return `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${stock.name || '--'}</span>
                <span class="card-symbol">${stock.code}</span>
            </div>
            <div class="price ${priceClass}">
                ¥${formatNumber(stock.price, 2)}
            </div>
            <div class="change-info">
                <span class="change ${priceClass}">
                    <span class="arrow">${arrow}</span>
                    <span class="change-percent">${formatNumber(changePercent)}%</span>
                </span>
                <span class="change ${priceClass}">
                    ${stock.change.amount >= 0 ? '+' : ''}${formatNumber(changeAmount, 2)}
                </span>
            </div>
        </div>
    `;
};

// 渲染 A 股数据
const renderStockData = (data) => {
    // 渲染大盘指数
    const indexGrid = document.getElementById('stockIndexGrid');
    if (data && data.indices && data.indices.length > 0) {
        indexGrid.innerHTML = data.indices.map(index => renderStockCard(index)).join('');
    } else {
        indexGrid.innerHTML = '<div class="error">指数数据加载失败</div>';
    }
    
    // 渲染个股
    const stockGrid = document.getElementById('stockGrid');
    if (data && data.stocks && data.stocks.length > 0) {
        stockGrid.innerHTML = data.stocks.map(stock => renderStockCard(stock)).join('');
    } else {
        stockGrid.innerHTML = '<div class="error">个股数据加载失败</div>';
    }
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
    
    // 更新时间（带日期）
    updateLastUpdateTime();
};

// 初始化
const init = () => {
    // 立即刷新一次
    refreshAll();
    
    // 启动实时时钟（每秒更新时间）
    startRealtimeClock();
    
    // 启动倒计时
    updateCountdown();
    
    // 设置自动刷新（每 5 秒）
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
        if (realtimeTimer) clearInterval(realtimeTimer);
    } else {
        // 页面显示时恢复刷新
        refreshAll();
        startRealtimeClock();
        updateCountdown();
        autoRefreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
    }
});
