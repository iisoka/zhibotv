// 模拟频道数据，包含多种协议的流媒体地址

// 初始化全局变量
let favoriteChannels = [];
let currentCategory = 'all';
let searchQuery = '';

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
let favoriteChannels = [];
let currentSort = 'name'; // 默认按名称排序
let searchQuery = '';
let currentCategory = 'all'; // 当前分类

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
function loadDashJs() {
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

// 初始化应用
function initApp() {
    renderChannels(channels);
    setupEventListeners();
    setupPlayerEvents();
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
    let filteredChannels = [...channels];
    
    // 应用分类筛选
    if (currentCategory === 'favorites') {
        filteredChannels = channels.filter(channel => favoriteChannels.includes(channel.id));
    } else if (currentCategory !== 'all') {
        filteredChannels = channels.filter(channel => channel.category === currentCategory);
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
        
        card.innerHTML = `
            <div class="channel-thumbnail">
                <img src="${channel.thumbnail}" alt="${channel.name}">
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}">
                    ${isFavorite ? '★' : '☆'}
                </button>
            </div>
            <div class="channel-details">
                <div class="channel-name">${channel.name}</div>
                <p class="channel-description">${channel.description}</p>
                <span class="channel-category">${getCategoryName(channel.category)}</span>
            </div>
        `;
        
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
function initApp() {
    // 从本地存储加载收藏频道
    loadFavoriteChannels();
    
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
            const channel = channels.find(c => c.id === channelId);
            if (channel) {
                playChannel(channel);
                // 记录最近观看
                recordRecentlyWatched(channelId);
            }
        }
    });
    
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

// 播放HLS流
function playHlsStream(url) {
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
function playDirectStream(url) {
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
function init() {
    loadFavoriteChannels();
    initApp();
    
    // 默认播放第一个频道
    if (channels.length > 0) {
        playChannel(channels[0]);
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
