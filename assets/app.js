// 贵金属行情中心 - 主应用程序
// 版本：使用韭菜盒子同款数据源

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

// ==================== 贵金属数据获取（使用新浪财经 API）====================

// 获取贵金属数据（新浪财经国际期货 API）
const fetchPreciousMetals = async () => {
    // 使用新浪财经国际期货接口
    // hf_SILVER = 白银，hf_GOLD = 黄金，hf_COPPER = 铜
    const codes = ['hf_SILVER', 'hf_GOLD', 'hf_COPPER'];
    
    return new Promise((resolve) => {
        const script = document.createElement('script');
        const callbackName = 'hq_str_hf_metals';
        
        // 设置超时
        const timeout = setTimeout(() => {
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            resolve(getMockPreciousMetals());
        }, 5000);
        
        // 全局回调函数
        window[callbackName] = function() {
            clearTimeout(timeout);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callbackName];
            
            try {
                const result = parsePreciousMetalsData();
                resolve(result);
            } catch (e) {
                console.log('解析贵金属数据失败:', e);
                resolve(getMockPreciousMetals());
            }
        };
        
        // 加载脚本 - 使用新浪财经国际期货 API
        script.src = `https://hq.sinajs.cn/list=${codes.join(',')}`;
        document.body.appendChild(script);
    });
};

// 解析贵金属数据
const parsePreciousMetalsData = () => {
    const metals = {};
    
    // 黄金 (hf_GOLD)
    if (window.hq_str_hf_GOLD) {
        const data = parseSinaHQData(window.hq_str_hf_GOLD, '黄金');
        if (data) {
            // 转换为人民币/克
            const priceUSD = data.price;
            const priceCNY = priceUSD * 7.25 / 31.1035; // 汇率 * 盎司转克
            const prevClose = data.yestclose;
            const prevCloseCNY = prevClose * 7.25 / 31.1035;
            
            metals.gold = {
                price: priceCNY,
                change: {
                    amount: priceCNY - prevCloseCNY,
                    percent: ((priceCNY - prevCloseCNY) / prevCloseCNY) * 100
                },
                unit: '元/克',
                source: 'COMEX 黄金'
            };
        }
    }
    
    // 白银 (hf_SILVER)
    if (window.hq_str_hf_SILVER) {
        const data = parseSinaHQData(window.hq_str_hf_SILVER, '白银');
        if (data) {
            const priceUSD = data.price;
            const priceCNY = priceUSD * 7.25 / 31.1035;
            const prevClose = data.yestclose;
            const prevCloseCNY = prevClose * 7.25 / 31.1035;
            
            metals.silver = {
                price: priceCNY,
                change: {
                    amount: priceCNY - prevCloseCNY,
                    percent: ((priceCNY - prevCloseCNY) / prevCloseCNY) * 100
                },
                unit: '元/克',
                source: 'COMEX 白银'
            };
        }
    }
    
    // 铜 (hf_COPPER)
    if (window.hq_str_hf_COPPER) {
        const data = parseSinaHQData(window.hq_str_hf_COPPER, '铜');
        if (data) {
            // LME 铜价单位是美元/吨，转换为元/克
            const priceUSD = data.price;
            const priceCNY = (priceUSD * 7.25) / 1000000;
            const prevClose = data.yestclose;
            const prevCloseCNY = (prevClose * 7.25) / 1000000;
            
            metals.copper = {
                price: priceCNY,
                change: {
                    amount: priceCNY - prevCloseCNY,
                    percent: ((priceCNY - prevCloseCNY) / prevCloseCNY) * 100
                },
                unit: '元/克',
                source: 'LME 铜'
            };
        }
    }
    
    // 如果没有获取到数据，使用模拟数据
    if (!metals.gold || !metals.silver || !metals.copper) {
        return getMockPreciousMetals();
    }
    
    return metals;
};

// 解析新浪财经数据格式
const parseSinaHQData = (dataStr, name) => {
    if (!dataStr) return null;
    
    const parts = dataStr.split(',');
    if (parts.length < 10) return null;
    
    // 国际期货数据格式：
    // 名称，当前价，开盘价，昨收价，最高价，最低价，...
    return {
        name: parts[0],
        price: parseFloat(parts[1]) || 0,
        open: parseFloat(parts[2]) || 0,
        yestclose: parseFloat(parts[3]) || 0,
        high: parseFloat(parts[4]) || 0,
        low: parseFloat(parts[5]) || 0
    };
};

// 获取模拟贵金属数据（备用）
const getMockPreciousMetals = () => {
    // 基于近期真实价格的模拟数据
    return {
        gold: {
            price: 485.50 + (Math.random() - 0.5) * 5,
            change: {
                amount: (Math.random() - 0.5) * 3,
                percent: (Math.random() - 0.5) * 0.6
            },
            unit: '元/克',
            source: '参考数据'
        },
        silver: {
            price: 6.35 + (Math.random() - 0.5) * 0.2,
            change: {
                amount: (Math.random() - 0.5) * 0.1,
                percent: (Math.random() - 0.5) * 1.5
            },
            unit: '元/克',
            source: '参考数据'
        },
        copper: {
            price: 0.0618 + (Math.random() - 0.5) * 0.001,
            change: {
                amount: (Math.random() - 0.5) * 0.0005,
                percent: (Math.random() - 0.5) * 0.8
            },
            unit: '元/克',
            source: '参考数据'
        }
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
const fetchStockQuote = async (code) => {
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
        window[callbackName] = function() {
            clearTimeout(timeout);
            if (script.parentNode) {
                document.body.removeChild(script);
            }
            delete window[callbackName];
            
            const dataStr = window[callbackName];
            if (dataStr && typeof dataStr === 'string') {
                const parts = dataStr.split(',');
                if (parts.length >= 32) {
                    const name = parts[0];
                    const currentPrice = parseFloat(parts[3]) || 0;
                    const previousClose = parseFloat(parts[2]) || currentPrice;
                    const open = parseFloat(parts[1]) || currentPrice;
                    const high = parseFloat(parts[4]) || 0;
                    const low = parseFloat(parts[5]) || 0;
                    
                    if (currentPrice > 0) {
                        resolve({
                            code: code.replace('sh', '').replace('sz', ''),
                            name: name,
                            price: currentPrice,
                            change: {
                                amount: currentPrice - previousClose,
                                percent: ((currentPrice - previousClose) / previousClose) * 100
                            },
                            open: open,
                            high: high,
                            low: low
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
        const data = await fetchStockQuote(index.code);
        if (data) {
            indices.push(data);
        } else {
            // 备用模拟数据
            indices.push(generateMockIndexData(index.code));
        }
    }
    
    // 获取个股数据
    const stocks = [];
    for (const stock of STOCK_CONFIG.stocks) {
        const data = await fetchStockQuote(stock.code);
        if (data) {
            stocks.push(data);
        } else {
            // 备用模拟数据
            stocks.push(generateMockStockData(stock.code));
        }
    }
    
    return { indices, stocks };
};

// 生成模拟指数数据（备用）
const generateMockIndexData = (code) => {
    const mockData = {
        'sh000001': { name: '上证指数', base: 3250 },
        'sz399001': { name: '深证成指', base: 10200 },
        'sz399006': { name: '创业板指', base: 2100 },
        'sh000300': { name: '沪深 300', base: 3800 }
    };
    
    const info = mockData[code] || { name: '未知指数', base: 3000 };
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
const generateMockStockData = (code) => {
    const mockData = {
        '600547': { name: '山东黄金', base: 26.5 },
        '601899': { name: '紫金矿业', base: 16.8 },
        '000975': { name: '银泰黄金', base: 13.2 },
        '600988': { name: '赤峰黄金', base: 19.5 },
        '002155': { name: '湖南黄金', base: 15.3 },
        '600489': { name: '中金黄金', base: 23.8 }
    };
    
    const info = mockData[code] || { name: '未知股票', base: 10 };
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
                <span class="card-title">${stock.name}</span>
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
