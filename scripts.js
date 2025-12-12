// 模拟频道数据，包含多种协议的流媒体地址

// 初始化全局变量
let favoriteChannels = [];
let currentCategory = 'all';
let searchQuery = '';
let userCustomChannels = [];
let staticChannels = [];
const USER_CUSTOM_CHANNELS_KEY = 'userCustomChannels';

// 从本地存储加载收藏频道
function loadFavoriteChannels() {
    try {
        const saved = localStorage.getItem('favoriteChannels');
        if (saved) {
            favoriteChannels = JSON.parse(saved);
        }
    } catch (error) {
        console.error('加载收藏失败:', error);
        favoriteChannels = [];
    }
}

// 保存收藏频道到本地存储
function saveFavoriteChannels() {
    try {
        localStorage.setItem('favoriteChannels', JSON.stringify(favoriteChannels));
    } catch (error) {
        console.error('保存收藏失败:', error);
    }
}

// 加载用户自定义频道（从Cloudflare D1数据库）
async function loadUserCustomChannels() {
    try {
        console.log('测试: 开始从数据库加载用户自定义频道');
        const response = await fetch('/api/channels', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                userCustomChannels = data.data.map(channel => ({
                    ...channel,
                    id: channel.id.toString(), // 确保ID是字符串格式
                    isCustom: true
                }));
                console.log('测试: 从数据库加载成功，共', userCustomChannels.length, '个自定义频道');
            }
        } else {
            console.error('测试: 从数据库加载失败，状态码:', response.status);
            // 失败时使用localStorage作为后备
            const saved = localStorage.getItem(USER_CUSTOM_CHANNELS_KEY);
            if (saved) {
                userCustomChannels = JSON.parse(saved);
                console.log('测试: 从localStorage加载后备数据，共', userCustomChannels.length, '个频道');
            }
        }
    } catch (error) {
        console.error('测试: 加载用户自定义频道失败:', error);
        userCustomChannels = [];
    }
}

// 添加用户自定义频道（保存到Cloudflare D1数据库）
async function addUserCustomChannel(channelData) {
    try {
        console.log('测试: 开始添加频道到数据库', channelData);
        const response = await fetch('/api/channels', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(channelData)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                const newChannel = {
                    ...data.data,
                    id: data.data.id.toString(),
                    isCustom: true
                };
                userCustomChannels.push(newChannel);
                console.log('测试: 频道添加到数据库成功');
                
                // 保存到localStorage作为后备
                saveUserCustomChannelsLocal();
                
                return newChannel;
            }
        }
        
        console.error('测试: 添加频道到数据库失败，状态码:', response.status);
        
        // 失败时回退到localStorage
        const fallbackChannel = addUserCustomChannelLocal(channelData);
        return fallbackChannel;
    } catch (error) {
        console.error('测试: 添加频道失败:', error);
        
        // 异常时回退到localStorage
        const fallbackChannel = addUserCustomChannelLocal(channelData);
        return fallbackChannel;
    }
}

// 删除用户自定义频道（从Cloudflare D1数据库）
async function deleteUserCustomChannel(channelId) {
    try {
        console.log('测试: 开始从数据库删除频道，ID:', channelId);
        
        // 如果是从数据库加载的频道，发送删除请求
        const dbChannel = userCustomChannels.find(channel => channel.id === channelId && channel.isCustom);
        if (dbChannel && !isNaN(Number(channelId))) {
            const response = await fetch(`/api/channels/${channelId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // 从本地数组中移除
                    userCustomChannels = userCustomChannels.filter(channel => channel.id !== channelId);
                    console.log('测试: 频道从数据库删除成功');
                    
                    // 更新localStorage后备
                    saveUserCustomChannelsLocal();
                    
                    return true;
                }
            }
            
            console.error('测试: 从数据库删除失败，状态码:', response.status);
        }
        
        // 失败时回退到localStorage
        return deleteUserCustomChannelLocal(channelId);
    } catch (error) {
        console.error('测试: 删除频道失败:', error);
        
        // 异常时回退到localStorage
        return deleteUserCustomChannelLocal(channelId);
    }
}

// 本地存储相关的后备函数
function saveUserCustomChannelsLocal() {
    try {
        localStorage.setItem(USER_CUSTOM_CHANNELS_KEY, JSON.stringify(userCustomChannels));
        console.log('测试: 保存到localStorage作为后备成功');
    } catch (error) {
        console.error('测试: 保存到localStorage失败:', error);
    }
}

function addUserCustomChannelLocal(channelData) {
    const newChannel = {
        id: Date.now().toString(), // 使用时间戳作为ID
        name: channelData.name,
        url: channelData.url,
        description: channelData.description || '',
        category: channelData.category || 'entertainment',
        isCustom: true,
        created_at: new Date().toISOString()
    };
    userCustomChannels.push(newChannel);
    saveUserCustomChannelsLocal();
    console.log('测试: 使用localStorage后备添加频道成功');
    return newChannel;
}

function deleteUserCustomChannelLocal(channelId) {
    const initialLength = userCustomChannels.length;
    userCustomChannels = userCustomChannels.filter(channel => channel.id !== channelId);
    const deleted = userCustomChannels.length < initialLength;
    if (deleted) {
        saveUserCustomChannelsLocal();
        console.log('测试: 使用localStorage后备删除频道成功');
    }
    return deleted;
}

// 注意：addUserCustomChannel函数已移至文件上方并改为异步版本

// 删除用户自定义频道
function deleteUserCustomChannel(channelId) {
    console.log('测试: 开始删除自定义频道，ID:', channelId);
    const index = userCustomChannels.findIndex(channel => channel.id === channelId);
    if (index !== -1) {
        console.log('测试: 找到频道，索引:', index);
        userCustomChannels.splice(index, 1);
        console.log('测试: 频道已从内存数组中移除');
        saveUserCustomChannels();
        return true;
    }
    console.log('测试: 未找到要删除的频道');
    return false;
}

// 获取所有频道（包括内置和自定义）
function getAllChannels() {
    return [...staticChannels, ...channels, ...userCustomChannels];
}

// 验证URL格式是否正确
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

// 加载静态频道数据
async function loadStaticChannels() {
    try {
        console.log('=== 开始加载静态频道数据 ===');
        
        // 检查文件是否存在的另一种方式
        console.log('尝试从 data/channels.json 加载数据...');
        
        const response = await fetch('data/channels.json');
        console.log('fetch响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('成功获取JSON数据:', typeof data, '数据结构:', Object.keys(data));
            
            // 验证数据格式
            if (!data || !Array.isArray(data.channels)) {
                console.error('频道数据格式错误，缺少channels数组:', data);
                // 创建默认测试频道以便显示
                staticChannels = [
                    {
                        id: 'static_test1',
                        name: '测试频道1',
                        description: '这是一个测试频道',
                        category: 'news',
                        url: 'https://example.com/stream1',
                        thumbnail: 'https://via.placeholder.com/300x200?text=Test+Channel+1',
                        protocol: 'direct'
                    },
                    {
                        id: 'static_test2',
                        name: '测试频道2',
                        description: '这是另一个测试频道',
                        category: 'entertainment',
                        url: 'https://example.com/stream2',
                        thumbnail: 'https://via.placeholder.com/300x200?text=Test+Channel+2',
                        protocol: 'direct'
                    }
                ];
                console.log('创建了默认测试频道，共', staticChannels.length, '个');
                return;
            }
            
            console.log('channels数组长度:', data.channels.length);
            console.log('前3个频道示例:', JSON.stringify(data.channels.slice(0, 3), null, 2));
            
            // 验证并处理频道数据
            staticChannels = data.channels.map((channel, index) => {
                let validUrl = channel.url;
                
                // URL格式验证和修正
                if (!isValidUrl(validUrl)) {
                    console.warn(`频道 ${channel.name} 的URL格式不正确: ${validUrl}`);
                    // 尝试添加https前缀（如果没有的话）
                    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                        validUrl = 'https://' + validUrl;
                        console.log(`尝试修正URL为: ${validUrl}`);
                    }
                }
                
                // 确保所有必需字段都存在
                const processedChannel = {
                    ...channel,
                    id: `static_${index + 1}`,
                    name: channel.name || `未命名频道${index + 1}`,
                    description: channel.description || `${channel.name || '未命名频道'} - ${channel.category || '未知'}频道`,
                    category: channel.category || 'other',
                    thumbnail: channel.thumbnail || 'https://via.placeholder.com/300x200?text=No+Thumbnail',
                    protocol: determineProtocol(validUrl),
                    url: validUrl
                };
                
                return processedChannel;
            });
            
            console.log('静态频道处理完成，共', staticChannels.length, '个频道');
            // 显示处理后的前几个频道
            console.log('处理后的前3个频道:', JSON.stringify(staticChannels.slice(0, 3), null, 2));
        } else {
            console.error('加载静态频道数据失败，状态码:', response.status);
            // 创建默认测试频道以便显示
            staticChannels = [
                {
                    id: 'static_test1',
                    name: '测试频道1',
                    description: '这是一个测试频道',
                    category: 'news',
                    url: 'https://example.com/stream1',
                    thumbnail: 'https://via.placeholder.com/300x200?text=Test+Channel+1',
                    protocol: 'direct'
                }
            ];
            console.log('创建了默认测试频道，因为加载失败');
        }
    } catch (error) {
        console.error('加载静态频道数据时出错:', error);
        // 创建默认测试频道以便显示
        staticChannels = [
            {
                id: 'static_test1',
                name: '测试频道1',
                description: '这是一个测试频道',
                category: 'news',
                url: 'https://example.com/stream1',
                thumbnail: 'https://via.placeholder.com/300x200?text=Test+Channel+1',
                protocol: 'direct'
            }
        ];
        console.log('创建了默认测试频道，因为发生异常');
    }
}

// 确定URL的协议类型
function determineProtocol(url) {
    if (url.endsWith('.m3u8')) return 'hls';
    if (url.endsWith('.mpd')) return 'dash';
    if (url.endsWith('.bmp')) return 'bmp';
    if (url.endsWith('.json')) return 'json';
    // 默认认为是直接流
    return 'direct';
}

// 频道数据
const channels = [
    {
        id: 1,
        name: '央视新闻',
        description: '央视新闻频道，24小时不间断报道国内外重要新闻',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // HLS协议
        thumbnail: 'https://via.placeholder.com/300x170?text=央视新闻',
        category: 'news',
        protocol: 'hls'
    },
    {
        id: 2,
        name: '湖南卫视',
        description: '湖南卫视，娱乐、综艺、电视剧综合频道',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=湖南卫视',
        category: 'entertainment',
        protocol: 'hls'
    },
    {
        id: 3,
        name: '东方卫视',
        description: '东方卫视，上海地区综合性卫星电视频道',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=东方卫视',
        category: 'entertainment',
        protocol: 'hls'
    },
    {
        id: 4,
        name: '央视体育',
        description: '央视体育频道，体育赛事直播和报道',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=央视体育',
        category: 'sports',
        protocol: 'hls'
    },
    {
        id: 5,
        name: '北京卫视',
        description: '北京卫视，北京地区综合性卫星电视频道',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=北京卫视',
        category: 'entertainment',
        protocol: 'hls'
    },
    {
        id: 6,
        name: '高清测试频道',
        description: '测试高清流媒体播放效果',
        url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', // DASH协议
        thumbnail: 'https://via.placeholder.com/300x170?text=高清测试',
        category: 'entertainment',
        protocol: 'dash'
    },
    {
        id: 7,
        name: '江苏卫视',
        description: '江苏卫视，综合性卫星电视频道',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=江苏卫视',
        category: 'entertainment',
        protocol: 'hls'
    },
    {
        id: 8,
        name: '央视教育',
        description: '央视教育频道，教育节目和文化内容',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        thumbnail: 'https://via.placeholder.com/300x170?text=央视教育',
        category: 'education',
        protocol: 'hls'
    }
];

// DOM 元素
const player = document.getElementById('live-player');
const channelsContainer = document.getElementById('channels-container');
const channelTitle = document.getElementById('channel-title');
const channelDescription = document.getElementById('channel-description');
const filterButtons = document.querySelectorAll('.filter-btn');
const headerNav = document.querySelector('nav ul');

// 全局配置
// favoriteChannels已在文件顶部声明
let currentSort = 'name'; // 默认按名称排序
// searchQuery已在文件顶部声明
// currentCategory已在文件顶部声明

// 流媒体播放器实例
let hls = null;
let dashPlayer = null;
let currentChannel = null;
let isPlaying = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

// 播放统计信息
const playbackStats = {
    startTime: null,
    totalBufferingTime: 0,
    lastBufferStart: null,
    isBuffering: false,
    qualityLevels: [],
    currentQuality: null
};

// 加载dash.js库
async function loadDashJs() {
    return new Promise((resolve, reject) => {
        // 检查是否已经加载了dash.js
        if (window.dashjs) {
            resolve(window.dashjs);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.dashjs.org/latest/dash.all.min.js';
        script.onload = () => resolve(window.dashjs);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 切换频道收藏状态
function toggleFavorite(channelId) {
    const channelIndex = favoriteChannels.indexOf(channelId);
    
    if (channelIndex === -1) {
        // 添加收藏
        favoriteChannels.push(channelId);
        showNotification('已添加到收藏');
    } else {
        // 取消收藏
        favoriteChannels.splice(channelIndex, 1);
        showNotification('已从收藏中移除');
    }
    
    // 保存到本地存储
    saveFavoriteChannels();
    
    // 更新UI
    updateChannelDisplay();
}

// 记录最近观看
function recordRecentlyWatched(channelId) {
    try {
        let recentlyWatched = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
        
        // 移除已存在的记录
        recentlyWatched = recentlyWatched.filter(id => id !== channelId);
        
        // 添加到最前面
        recentlyWatched.unshift(channelId);
        
        // 限制最近观看数量
        if (recentlyWatched.length > 20) {
            recentlyWatched = recentlyWatched.slice(0, 20);
        }
        
        localStorage.setItem('recentlyWatched', JSON.stringify(recentlyWatched));
    } catch (error) {
        console.error('记录最近观看失败:', error);
    }
}

// 获取最近观看频道
function getRecentlyWatchedChannels() {
    try {
        const recentlyWatched = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
        return channels.filter(channel => recentlyWatched.includes(channel.id));
    } catch (error) {
        console.error('获取最近观看失败:', error);
        return [];
    }
}

// 更新频道显示
function updateChannelDisplay() {
    let allChannels = getAllChannels();
    let filteredChannels = [...allChannels];
    
    // 应用分类筛选
    if (currentCategory === 'favorites') {
        filteredChannels = allChannels.filter(channel => favoriteChannels.includes(channel.id));
    } else if (currentCategory !== 'all') {
        filteredChannels = allChannels.filter(channel => channel.category === currentCategory);
    }
    
    // 应用搜索筛选
    if (searchQuery) {
        filteredChannels = filteredChannels.filter(channel => 
            channel.name.toLowerCase().includes(searchQuery) ||
            channel.description.toLowerCase().includes(searchQuery) ||
            getCategoryName(channel.category).toLowerCase().includes(searchQuery)
        );
    }
    
    // 应用排序
    switch (currentSort) {
        case 'name':
            filteredChannels.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'category':
            filteredChannels.sort((a, b) => getCategoryName(a.category).localeCompare(getCategoryName(b.category)));
            break;
        case 'recent':
            // 根据最近观看排序
            const recentlyWatched = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
            filteredChannels.sort((a, b) => {
                const aIndex = recentlyWatched.indexOf(a.id);
                const bIndex = recentlyWatched.indexOf(b.id);
                
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
            break;
    }
    
    renderChannels(filteredChannels);
}

// 渲染频道列表
function renderChannels(channelsList) {
    channelsContainer.innerHTML = '';
    
    // 检查是否有频道
    if (channelsList.length === 0) {
        channelsContainer.innerHTML = `
            <div class="no-channels">
                <p>没有找到匹配的频道</p>
                <button id="reset-filters" class="btn">重置筛选条件</button>
            </div>
        `;
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            currentCategory = 'all';
            searchQuery = '';
            document.getElementById('channel-search').value = '';
            updateActiveFilterButton('all');
            updateChannelDisplay();
        });
        
        return;
    }
    
    channelsList.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.setAttribute('data-channel-id', channel.id);
        
        // 检查是否是当前播放的频道
        const isActive = currentChannel && currentChannel.id === channel.id;
        if (isActive) {
            card.classList.add('active');
        }
        
        // 检查是否已收藏
        const isFavorite = favoriteChannels.includes(channel.id);
        
        // 检查是否是自定义频道
        const isCustom = channel.isCustom || false;
        
        card.innerHTML = `
            <div class="channel-thumbnail">
                <img src="${channel.thumbnail}" alt="${channel.name}">
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}">
                    ${isFavorite ? '★' : '☆'}
                </button>
                ${isCustom ? '<span class="custom-badge">自定义</span>' : ''}
            </div>
            <div class="channel-details">
                <div class="channel-name">${channel.name}</div>
                <p class="channel-description">${channel.description}</p>
                <span class="channel-category">${getCategoryName(channel.category)}</span>
            </div>
        `;
        
        // 添加自定义频道类名
        if (isCustom) {
            card.classList.add('custom-channel');
            
            // 添加删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-channel-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.title = '删除自定义频道';
            
            // 添加删除频道的点击事件
            deleteBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (confirm(`确定要删除频道"${channel.name}"吗？`)) {
                    await deleteUserCustomChannel(channel.id);
                    showNotification('频道已删除');
                    updateChannelDisplay();
                }
            });
            
            // 将删除按钮添加到频道详情区域
            const channelDetails = card.querySelector('.channel-details');
            channelDetails.appendChild(deleteBtn);
        }
        
        channelsContainer.appendChild(card);
    });
}

// 显示通知
function showNotification(message) {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        
        notification.style.position = 'fixed';
        notification.style.top = '2rem';
        notification.style.right = '2rem';
        notification.style.backgroundColor = 'rgba(33, 33, 33, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '1rem 1.5rem';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '9999';
        notification.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
    notification.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

// 获取分类中文名
function getCategoryName(category) {
    const categoryMap = {
        'news': '新闻',
        'entertainment': '娱乐',
        'sports': '体育',
        'education': '教育'
    };
    return categoryMap[category] || category;
}

// 初始化应用
async function initApp() {
    // 从本地存储加载收藏频道
    loadFavoriteChannels();
    
    // 自动初始化数据库
    try {
        console.log('测试: 开始初始化数据库');
        const initResponse = await fetch('/api/init-db', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const initData = await initResponse.json();
        console.log('测试: 数据库初始化结果:', initData.message);
    } catch (error) {
        console.error('测试: 数据库初始化失败:', error);
    }
    
    // 加载静态频道数据
    await loadStaticChannels();
    
    // 从数据库加载自定义频道（异步）
    await loadUserCustomChannels();
    
    // 创建导航栏和功能区
    createNavigationElements();
    createChannelManagementUI();
    
    // 初始渲染
    updateChannelDisplay();
    setupEventListeners();
    setupPlayerEvents();
}

// 从本地存储加载收藏频道
function loadFavoriteChannels() {
    try {
        const savedFavorites = localStorage.getItem('favoriteChannels');
        if (savedFavorites) {
            favoriteChannels = JSON.parse(savedFavorites);
        }
    } catch (error) {
        console.error('加载收藏频道失败:', error);
        favoriteChannels = [];
    }
}

// 保存收藏频道到本地存储
function saveFavoriteChannels() {
    try {
        localStorage.setItem('favoriteChannels', JSON.stringify(favoriteChannels));
    } catch (error) {
        console.error('保存收藏频道失败:', error);
    }
}

// 创建导航元素
function createNavigationElements() {
    // 创建收藏导航项
    const favoritesNavItem = document.createElement('li');
    favoritesNavItem.innerHTML = '\u003ca href="#" id="favorites-nav">收藏</a>';
    headerNav.appendChild(favoritesNavItem);
    
    // 更新现有导航项
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const navText = link.textContent.trim();
            
            if (navText === '首页') {
                currentCategory = 'all';
                updateActiveFilterButton('all');
            } else if (navText === '分类') {
                // 切换分类显示
                toggleCategoriesPanel();
            } else if (navText === '收藏') {
                currentCategory = 'favorites';
                updateActiveFilterButton('favorites');
            }
            
            updateChannelDisplay();
        });
    });
}

// 创建频道管理UI
function createChannelManagementUI() {
    const channelsSection = document.querySelector('.channels-section');
    
    // 在频道区域顶部创建管理栏
    const managementBar = document.createElement('div');
    managementBar.className = 'channel-management-bar';
    managementBar.style.display = 'flex';
    managementBar.style.justifyContent = 'space-between';
    managementBar.style.alignItems = 'center';
    managementBar.style.marginBottom = '1.5rem';
    managementBar.style.padding = '1rem';
    managementBar.style.backgroundColor = '#f8f9fa';
    managementBar.style.borderRadius = '8px';
    
    // 搜索框
    const searchContainer = document.createElement('div');
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.flex = '1';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索频道...';
    searchInput.id = 'channel-search';
    searchInput.style.padding = '0.5rem 1rem';
    searchInput.style.border = '1px solid #ddd';
    searchInput.style.borderRadius = '20px';
    searchInput.style.fontSize = '1rem';
    searchInput.style.width = '300px';
    
    searchContainer.appendChild(searchInput);
    
    // 排序选择器
    const sortContainer = document.createElement('div');
    sortContainer.style.display = 'flex';
    sortContainer.style.alignItems = 'center';
    sortContainer.style.gap = '1rem';
    
    const sortLabel = document.createElement('span');
    sortLabel.textContent = '排序:';
    
    const sortSelect = document.createElement('select');
    sortSelect.id = 'channel-sort';
    sortSelect.style.padding = '0.5rem';
    sortSelect.style.border = '1px solid #ddd';
    sortSelect.style.borderRadius = '4px';
    
    const sortOptions = [
        { value: 'name', text: '按名称' },
        { value: 'category', text: '按分类' },
        { value: 'recent', text: '最近观看' }
    ];
    
    sortOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        sortSelect.appendChild(opt);
    });
    
    sortContainer.appendChild(sortLabel);
    sortContainer.appendChild(sortSelect);
    
    // 添加到管理栏
    managementBar.appendChild(searchContainer);
    managementBar.appendChild(sortContainer);
    
    // 插入到频道区域的最前面
    channelsSection.insertBefore(managementBar, channelsSection.firstChild);
    
    // 分类面板（默认隐藏）
    createCategoriesPanel();
}

// 创建分类面板
function createCategoriesPanel() {
    const categoriesPanel = document.createElement('div');
    categoriesPanel.id = 'categories-panel';
    categoriesPanel.style.position = 'fixed';
    categoriesPanel.style.top = '70px';
    categoriesPanel.style.right = '-300px';
    categoriesPanel.style.width = '300px';
    categoriesPanel.style.height = 'calc(100vh - 70px)';
    categoriesPanel.style.backgroundColor = 'white';
    categoriesPanel.style.boxShadow = 'var(--box-shadow-hover)';
    categoriesPanel.style.padding = '1.5rem';
    categoriesPanel.style.zIndex = '999';
    categoriesPanel.style.transition = 'right 0.3s ease';
    categoriesPanel.style.overflowY = 'auto';
    
    const panelHeader = document.createElement('div');
    panelHeader.style.display = 'flex';
    panelHeader.style.justifyContent = 'space-between';
    panelHeader.style.alignItems = 'center';
    panelHeader.style.marginBottom = '1.5rem';
    
    const panelTitle = document.createElement('h3');
    panelTitle.textContent = '频道分类';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.id = 'close-categories';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '1.5rem';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    
    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeButton);
    
    categoriesPanel.appendChild(panelHeader);
    
    // 分类列表
    const categoryList = document.createElement('ul');
    categoryList.style.listStyle = 'none';
    categoryList.style.padding = 0;
    
    const categories = [
        { id: 'all', name: '全部频道' },
        { id: 'news', name: '新闻' },
        { id: 'entertainment', name: '娱乐' },
        { id: 'sports', name: '体育' },
        { id: 'education', name: '教育' },
        { id: 'favorites', name: '收藏频道' }
    ];
    
    categories.forEach(category => {
        const li = document.createElement('li');
        li.style.marginBottom = '1rem';
        
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = category.name;
        link.setAttribute('data-category', category.id);
        link.style.display = 'block';
        link.style.padding = '0.75rem';
        link.style.borderRadius = '8px';
        link.style.color = '#333';
        link.style.textDecoration = 'none';
        link.style.transition = 'background-color 0.3s ease';
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = category.id;
            updateActiveFilterButton(category.id);
            updateChannelDisplay();
            toggleCategoriesPanel();
        });
        
        li.appendChild(link);
        categoryList.appendChild(li);
    });
    
    categoriesPanel.appendChild(categoryList);
    
    document.body.appendChild(categoriesPanel);
    
    // 遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'categories-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '998';
    overlay.style.display = 'none';
    
    document.body.appendChild(overlay);
}

// 切换分类面板显示
function toggleCategoriesPanel() {
    const panel = document.getElementById('categories-panel');
    const overlay = document.getElementById('categories-overlay');
    
    if (panel.style.right === '0px') {
        panel.style.right = '-300px';
        overlay.style.display = 'none';
    } else {
        panel.style.right = '0px';
        overlay.style.display = 'block';
    }
}

// 更新活跃的筛选按钮
function updateActiveFilterButton(category) {
    // 更新顶部筛选按钮
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    // 更新分类面板中的活跃项
    const categoryLinks = document.querySelectorAll('#categories-panel a[data-category]');
    categoryLinks.forEach(link => {
        link.style.backgroundColor = link.getAttribute('data-category') === category ? '#e3f2fd' : '';
        link.style.color = link.getAttribute('data-category') === category ? 'var(--primary-color)' : '#333';
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 频道点击事件
    channelsContainer.addEventListener('click', (e) => {
        // 检查是否点击了收藏按钮
        if (e.target.closest('.favorite-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const channelCard = e.target.closest('.channel-card');
            if (channelCard) {
                const channelId = parseInt(channelCard.getAttribute('data-channel-id'));
                toggleFavorite(channelId);
            }
            return;
        }
        
        // 正常的频道点击事件
        const channelCard = e.target.closest('.channel-card');
        if (channelCard) {
            const channelId = parseInt(channelCard.getAttribute('data-channel-id'));
            // 从所有频道中查找，包括自定义频道
            const allChannels = getAllChannels();
            const channel = allChannels.find(c => c.id === channelId);
            if (channel) {
                playChannel(channel);
                // 记录最近观看
                recordRecentlyWatched(channelId);
            }
        }
    });
    
    // 添加频道按钮和模态窗口事件
    const addChannelBtn = document.getElementById('add-channel-btn');
    const addChannelModal = document.getElementById('add-channel-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addChannelForm = document.getElementById('add-channel-form');
    
    if (addChannelBtn && addChannelModal) {
        // 显示添加频道模态窗口
        addChannelBtn.addEventListener('click', () => {
            addChannelModal.style.display = 'block';
        });
        
        // 关闭模态窗口
        const closeModal = () => {
            addChannelModal.style.display = 'none';
            addChannelForm.reset();
        };
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }
        
        // 点击模态窗口外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === addChannelModal) {
                closeModal();
            }
        });
        
        // 提交添加频道表单
        if (addChannelForm) {
            addChannelForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('channel-name').value.trim();
                const url = document.getElementById('channel-url').value.trim();
                const description = document.getElementById('channel-description-input').value.trim();
                const category = document.getElementById('channel-category').value;
                
                if (!name || !url) {
                    alert('请填写频道名称和URL');
                    return;
                }
                
                // 添加新频道
                const newChannel = await addUserCustomChannel({
                    name,
                    url,
                    description,
                    category
                });
                
                if (newChannel) {
                    showNotification('频道添加成功');
                    closeModal();
                    updateChannelDisplay();
                } else {
                    showNotification('频道添加失败');
                }
            });
        }
    }
    
    // 分类筛选事件
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            currentCategory = category;
            updateActiveFilterButton(category);
            updateChannelDisplay();
        });
    });
    
    // 搜索事件
    const searchInput = document.getElementById('channel-search');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        updateChannelDisplay();
    });
    
    // 排序事件
    const sortSelect = document.getElementById('channel-sort');
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        updateChannelDisplay();
    });
    
    // 关闭分类面板
    document.getElementById('close-categories').addEventListener('click', toggleCategoriesPanel);
    document.getElementById('categories-overlay').addEventListener('click', toggleCategoriesPanel);
    
    // 播放器全屏事件
    player.addEventListener('dblclick', toggleFullscreen);
    
    // 键盘快捷键 - 仅在非触摸设备上启用
    if (!isTouchDevice()) {
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // 为移动设备添加触摸优化
    if (isTouchDevice()) {
        addTouchOptimizations();
    }
    
    // 网络状态变化检测
    window.addEventListener('online', () => {
        if (currentChannel && !isPlaying) {
            playChannel(currentChannel);
        }
    });
    
    window.addEventListener('offline', () => {
        showError('网络连接已断开，请检查网络设置');
    });
}

// 设置播放器事件
function setupPlayerEvents() {
    // 播放开始事件
    player.addEventListener('play', () => {
        isPlaying = true;
        if (!playbackStats.startTime) {
            playbackStats.startTime = new Date();
        }
        updatePlaybackStatus();
    });
    
    // 播放暂停事件
    player.addEventListener('pause', () => {
        isPlaying = false;
        updatePlaybackStatus();
    });
    
    // 播放结束事件
    player.addEventListener('ended', () => {
        isPlaying = false;
        updatePlaybackStatus();
        // 直播流结束时尝试重新连接
        if (currentChannel) {
            setTimeout(() => playChannel(currentChannel), 1000);
        }
    });
    
    // 错误事件
    player.addEventListener('error', (e) => {
        handlePlayerError(e);
    });
    
    // 缓冲开始事件
    player.addEventListener('waiting', () => {
        if (!playbackStats.isBuffering) {
            playbackStats.isBuffering = true;
            playbackStats.lastBufferStart = new Date();
        }
        updatePlaybackStatus();
    });
    
    // 缓冲结束事件
    player.addEventListener('playing', () => {
        if (playbackStats.isBuffering && playbackStats.lastBufferStart) {
            const bufferTime = (new Date() - playbackStats.lastBufferStart) / 1000;
            playbackStats.totalBufferingTime += bufferTime;
            playbackStats.isBuffering = false;
            playbackStats.lastBufferStart = null;
        }
        updatePlaybackStatus();
    });
}

// 处理键盘快捷键
function handleKeyboardShortcuts(e) {
    // 只在播放器聚焦或没有其他输入框聚焦时处理快捷键
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (e.key) {
        case ' ': // 空格键：播放/暂停
            e.preventDefault();
            if (player.paused) {
                player.play();
            } else {
                player.pause();
            }
            break;
        case 'f': // F键：切换全屏
            toggleFullscreen();
            break;
        case 'm': // M键：切换静音
            player.muted = !player.muted;
            break;
        case 'ArrowRight': // 右箭头：快进10秒
            player.currentTime = Math.min(player.currentTime + 10, player.duration || Infinity);
            break;
        case 'ArrowLeft': // 左箭头：快退10秒
            player.currentTime = Math.max(player.currentTime - 10, 0);
            break;
        case 'ArrowUp': // 上箭头：增加音量
            player.volume = Math.min(player.volume + 0.1, 1);
            break;
        case 'ArrowDown': // 下箭头：减少音量
            player.volume = Math.max(player.volume - 0.1, 0);
            break;
    }
}

// 更新播放状态UI
function updatePlaybackStatus() {
    // 这里可以更新UI显示播放状态
    const statusText = isPlaying ? '正在播放' : '已暂停';
    const channelInfo = document.getElementById('channel-info');
    
    // 检查是否已有状态元素
    let statusElement = channelInfo.querySelector('.playback-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'playback-status';
        statusElement.style.fontSize = '0.9rem';
        statusElement.style.color = '#666';
        statusElement.style.marginTop = '0.5rem';
        channelInfo.appendChild(statusElement);
    }
    
    statusElement.textContent = `${statusText} ${playbackStats.isBuffering ? '(缓冲中...)' : ''}`;
}

// 处理播放器错误
function handlePlayerError(event) {
    console.error('播放器错误:', event);
    
    let errorMessage = '播放出错';
    switch (player.error.code) {
        case 1: // MEDIA_ERR_ABORTED
            errorMessage = '播放已中止';
            break;
        case 2: // MEDIA_ERR_NETWORK
            errorMessage = '网络连接错误';
            // 尝试重新连接
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                errorMessage += `，正在尝试第 ${reconnectAttempts} 次重新连接...`;
                setTimeout(() => {
                    if (currentChannel) {
                        playChannel(currentChannel);
                    }
                }, 3000 * reconnectAttempts); // 指数退避
            } else {
                errorMessage += '，已达到最大重连次数';
                reconnectAttempts = 0;
            }
            break;
        case 3: // MEDIA_ERR_DECODE
            errorMessage = '媒体解码错误';
            break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = '不支持的媒体格式';
            break;
    }
    
    showError(errorMessage);
}

// 播放频道
async function playChannel(channel) {
    // 重置重连计数器
    reconnectAttempts = 0;
    
    // 更新当前频道
    currentChannel = channel;
    
    // 更新频道信息
    channelTitle.textContent = channel.name;
    channelDescription.textContent = channel.description;
    
    // 停止当前播放
    stopCurrentPlayback();
    
    // 显示加载状态
    showLoading();
    
    try {
        // 根据协议类型选择不同的播放方式
        if (channel.protocol === 'hls' || channel.url.includes('.m3u8')) {
            await playHlsStream(channel.url);
        } else if (channel.protocol === 'dash' || channel.url.includes('.mpd')) {
            await playDashStream(channel.url);
        } else if (channel.url.includes('.bmp')) {
            // 处理BMP格式直播源
            await playBmpStream(channel.url);
        } else if (channel.url.includes('.json')) {
            // 处理JSON格式直播源
            await playJsonStream(channel.url);
        } else {
            // 尝试直接播放其他格式
            playDirectStream(channel.url);
        }
    } catch (error) {
        console.error('播放失败:', error);
        showError(`播放失败: ${error.message || '未知错误'}`);
    } finally {
        hideLoading();
    }
}

// 停止当前播放
function stopCurrentPlayback() {
    // 重置播放统计
    playbackStats.startTime = null;
    playbackStats.isBuffering = false;
    playbackStats.lastBufferStart = null;
    playbackStats.qualityLevels = [];
    playbackStats.currentQuality = null;
    
    // 停止HLS播放
    if (hls) {
        hls.destroy();
        hls = null;
    }
    
    // 停止DASH播放
    if (dashPlayer) {
        dashPlayer.reset();
        dashPlayer = null;
    }
    
    // 清空播放器
    player.src = '';
    player.load();
    isPlaying = false;
}

// 播放BMP格式直播源
async function playBmpStream(url) {
    try {
        // 以ArrayBuffer格式获取BMP文件
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        // 获取ArrayBuffer数据
        const arrayBuffer = await response.arrayBuffer();
            
        // 创建Blob对象，指定MIME类型
        const blob = new Blob([arrayBuffer], { type: 'video/mp4' }); // 使用通用视频MIME类型
        
        // 创建Blob URL
        const videoUrl = URL.createObjectURL(blob);
        
        // 设置播放器源并播放
        player.src = videoUrl;
        
        // 监听播放开始事件
        player.oncanplay = () => {
            player.play().then(() => {
                // 播放成功
            }).catch(error => {
                throw error;
            });
            player.oncanplay = null;
        };
        
        // 监听错误事件
        player.onerror = (e) => {
            URL.revokeObjectURL(videoUrl);
            player.onerror = null;
        };
        
        // 监听播放结束，释放URL
        player.onended = () => {
            URL.revokeObjectURL(videoUrl);
            player.onended = null;
        };
        } catch (error) {
            console.error('BMP播放错误:', error);
            throw new Error('BMP流加载或播放失败');
        }
}

// 播放JSON格式直播源
async function playJsonStream(url) {
    try {
        // 获取JSON文件
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        // 解析JSON数据
        const jsonData = await response.json();
            
        // 尝试提取直播流URL的函数
        const extractStreamUrl = (data) => {
            // 常见直播URL字段
            const urlFields = ['url', 'streamUrl', 'hlsUrl', 'dashUrl', 'videoUrl', 'source'];
            
            // 检查对象中的直接URL字段
            for (const field of urlFields) {
                if (data[field] && typeof data[field] === 'string' && 
                    (data[field].includes('.m3u8') || data[field].includes('.mpd') || 
                     data[field].includes('.mp4') || data[field].includes('.webm'))) {
                    return data[field];
                }
            }
            
            // 检查streams数组
            if (data.streams && Array.isArray(data.streams)) {
                for (const stream of data.streams) {
                    const foundUrl = extractStreamUrl(stream);
                    if (foundUrl) return foundUrl;
                }
            }
            
            // 检查sources数组
            if (data.sources && Array.isArray(data.sources)) {
                for (const source of data.sources) {
                    const foundUrl = extractStreamUrl(source);
                    if (foundUrl) return foundUrl;
                }
            }
            
            // 检查media数组
            if (data.media && Array.isArray(data.media)) {
                for (const media of data.media) {
                    const foundUrl = extractStreamUrl(media);
                    if (foundUrl) return foundUrl;
                }
            }
            
            // 检查嵌套对象
            for (const key in data) {
                if (typeof data[key] === 'object' && data[key] !== null) {
                    const foundUrl = extractStreamUrl(data[key]);
                    if (foundUrl) return foundUrl;
                }
            }
            
            return null;
        };
        
        // 提取直播流URL
        const streamUrl = extractStreamUrl(jsonData);
        
        if (!streamUrl) {
            throw new Error('JSON格式中未找到有效的直播流URL');
        }
        
        console.log('从JSON中提取的直播流URL:', streamUrl);
        
        // 根据提取的URL格式选择相应的播放方法
        if (streamUrl.includes('.m3u8')) {
            await playHlsStream(streamUrl);
        } else if (streamUrl.includes('.mpd')) {
            await playDashStream(streamUrl);
        } else {
            playDirectStream(streamUrl);
        }
        } catch (error) {
            console.error('JSON播放错误:', error);
            throw new Error(`JSON流加载或播放失败: ${error.message}`);
        }
}

// 播放HLS流
async function playHlsStream(url) {
    return new Promise((resolve, reject) => {
        if (Hls.isSupported()) {
            hls = new Hls({
                maxBufferLength: 30, // 最大缓冲长度
                maxMaxBufferLength: 60,
                maxBufferHole: 0.5,
                startLevel: -1, // 自动选择质量
                capLevelToPlayerSize: true, // 根据播放器大小限制质量
                enableWorker: true, // 启用Web Worker
                lowLatencyMode: true // 低延迟模式
            });
            
            hls.loadSource(url);
            hls.attachMedia(player);
            
            // 监听质量级别变化
            hls.on(Hls.Events.LEVELS_UPDATED, (event, data) => {
                playbackStats.qualityLevels = data.levels.map((level, index) => ({
                    index,
                    height: level.height,
                    bandwidth: level.bandwidth
                }));
            });
            
            // 当前质量变化
            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                playbackStats.currentQuality = playbackStats.qualityLevels[data.level];
            });
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                player.play().then(resolve).catch(reject);
            });
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS 错误:', data);
                
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('网络错误，尝试重新加载...');
                            hls.loadSource(url);
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('媒体错误');
                            reject(new Error('媒体解码错误'));
                            break;
                        default:
                            reject(new Error('HLS播放错误'));
                    }
                }
            });
        } else if (player.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari 原生支持 HLS
            player.src = url;
            player.play().then(resolve).catch(reject);
        } else {
            reject(new Error('您的浏览器不支持 HLS 流媒体播放'));
        }
    });
}

// 播放DASH流
async function playDashStream(url) {
    try {
        const dashjs = await loadDashJs();
        dashPlayer = dashjs.MediaPlayer().create();
        
        // 配置DASH播放器
        dashPlayer.updateSettings({
            'streaming': {
                'abr': {
                    'autoSwitchBitrate': {
                        'video': true
                    },
                    'bandwidthSafetyFactor': 0.9
                },
                'buffer': {
                    'stableBufferTime': 15,
                    'bufferTimeAtTopQuality': 8
                }
            }
        });
        
        dashPlayer.initialize(player, url, true);
        
        // 监听质量变化
        dashPlayer.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e) => {
            if (e.mediaType === 'video') {
                playbackStats.currentQuality = {
                    index: e.newQuality,
                    bitrate: dashPlayer.getBitrateInfoListFor('video')[e.newQuality].bitrate
                };
            }
        });
        
        return new Promise((resolve) => {
            dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, resolve);
        });
    } catch (error) {
        console.error('DASH播放错误:', error);
        throw new Error('DASH流播放失败');
    }
}

// 直接播放其他格式
async function playDirectStream(url) {
    return new Promise((resolve, reject) => {
        player.src = url;
        player.play().then(resolve).catch(reject);
    });
}

// 显示加载状态
function showLoading() {
    const playerContainer = player.parentElement;
    let loadingElement = playerContainer.querySelector('.loading-overlay');
    
    if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.className = 'loading-overlay';
        loadingElement.style.position = 'absolute';
        loadingElement.style.top = '0';
        loadingElement.style.left = '0';
        loadingElement.style.width = '100%';
        loadingElement.style.height = '100%';
        loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingElement.style.display = 'flex';
        loadingElement.style.justifyContent = 'center';
        loadingElement.style.alignItems = 'center';
        loadingElement.style.zIndex = '10';
        loadingElement.style.borderRadius = '8px';
        
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.style.width = '50px';
        loadingSpinner.style.height = '50px';
        loadingSpinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
        loadingSpinner.style.borderTop = '4px solid white';
        loadingSpinner.style.borderRadius = '50%';
        loadingSpinner.style.animation = 'spin 1s linear infinite';
        
        const loadingText = document.createElement('div');
        loadingText.textContent = '正在加载...';
        loadingText.style.color = 'white';
        loadingText.style.marginLeft = '10px';
        loadingText.style.fontSize = '16px';
        
        loadingElement.appendChild(loadingSpinner);
        loadingElement.appendChild(loadingText);
        playerContainer.style.position = 'relative';
        playerContainer.appendChild(loadingElement);
    } else {
        loadingElement.style.display = 'flex';
    }
}

// 隐藏加载状态
function hideLoading() {
    const playerContainer = player.parentElement;
    const loadingElement = playerContainer.querySelector('.loading-overlay');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 显示错误信息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // 插入到播放器下方
    player.parentNode.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// 切换全屏模式
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.mozRequestFullScreen) {
            player.mozRequestFullScreen();
        } else if (player.webkitRequestFullscreen) {
            player.webkitRequestFullscreen();
        } else if (player.msRequestFullscreen) {
            player.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// 主函数，初始化应用
async function init() {
    loadFavoriteChannels();
    // 直接调用async函数并处理错误
    try {
        await initApp();
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
    
    // 默认播放第一个频道
    const allChannels = getAllChannels();
    if (allChannels.length > 0) {
        playChannel(allChannels[0]);
    }
}

// 检测是否为触摸设备
function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}

// 添加触摸优化
function addTouchOptimizations() {
    // 为频道卡片添加触摸反馈
    const channelCards = document.querySelectorAll('.channel-card');
    channelCards.forEach(card => {
        // 添加触摸开始效果
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.transition = 'transform 0.1s ease';
        });
        
        // 触摸结束/取消时恢复
        function restoreCard() {
            this.style.transform = '';
            this.style.transition = 'transform 0.3s ease';
        }
        
        card.addEventListener('touchend', restoreCard);
        card.addEventListener('touchcancel', restoreCard);
    });
    
    // 优化收藏按钮在移动设备上的体验
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
        button.style.touchAction = 'manipulation'; // 防止双击缩放
        
        // 触摸反馈
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
    
    // 优化管理栏在小屏幕上的交互
    if (window.innerWidth <= 768) {
        const managementBar = document.querySelector('.channel-management-bar');
        if (managementBar) {
            // 确保搜索框在小屏幕上有更好的触摸区域
            const searchInput = document.getElementById('channel-search');
            if (searchInput) {
                searchInput.style.height = '44px'; // 触摸友好的高度
            }
            
            // 确保下拉菜单有更好的触摸体验
            const sortSelect = document.getElementById('channel-sort');
            if (sortSelect) {
                sortSelect.style.height = '44px'; // 触摸友好的高度
            }
        }
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

// 窗口大小变化时更新响应式设计
window.addEventListener('resize', function() {
    // 重新计算布局
    if (window.innerWidth <= 768 && isTouchDevice()) {
        addTouchOptimizations();
    }
    
    // 如果分类面板打开且屏幕变宽，自动关闭
    if (window.innerWidth > 1024) {
        const panel = document.getElementById('categories-panel');
        if (panel && panel.style.right === '0px') {
            toggleCategoriesPanel();
        }
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (hls) {
        hls.destroy();
    }
});
