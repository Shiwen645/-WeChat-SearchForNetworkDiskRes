// 默认响应内容（在API响应不了内容时）
const defaultData = require('../../utils/defaultData')
Page({
  data: {
    inputValue: '',          // 搜索框输入值
    autoFocus: false,       // 是否自动聚焦
    hotKeywords: ['电影', '电子书', '软件', '教程', '音乐', 'PPT模板', '考研资料', '设计素材'],
    history: [],            // 搜索历史
    categories: [
      { id: 1, name: '电影', icon: '/assets/icons/movie.svg' },
      { id: 2, name: '电子书', icon: '/assets/icons/book.svg' },
      { id: 3, name: '音乐', icon: '/assets/icons/music.svg' },
      { id: 4, name: '软件', icon: '/assets/icons/app.svg' },
      { id: 5, name: '教程', icon: '/assets/icons/course.svg' },
      { id: 6, name: '文档', icon: '/assets/icons/doc.svg' },
      { id: 7, name: '图片', icon: '/assets/icons/image.svg' },
      { id: 8, name: '压缩包', icon: '/assets/icons/zip.svg' }
    ],
    categoryResults: [],    // 分类搜索结果
    currentCategory: '',    // 当前选中分类
    articles: defaultData   // 首页默认展示数据
  },
  // 页面加载时初始化数据
  onLoad() {
    this.loadSearchHistory();
  },
  // 页面显示时加载搜索历史
  onShow() {
    this.loadSearchHistory();
  },
  // 获取搜索历史（本地储存）（微信API：getStorageSync）
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ history });
  },
  // 处理输入框输入事件
  handleInput(e) {
    this.setData({ inputValue: e.detail.value });
  },
  // 处理清除按钮点击事件
  handleClear() {
    this.setData({ inputValue: '', autoFocus: true });
  },
  // 处理搜索逻辑
  doSearch(keyword) {
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }

    // 更新搜索历史
    let history = this.data.history;
    history = history.filter(item => item !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    wx.setStorageSync('searchHistory', history);

    // 存储搜索关键词到全局
    const app = getApp();
    app.globalData.searchKeyword = keyword;

    // 跳转到搜索结果页
    wx.switchTab({
      url: '/pages/searchResult/searchResult'
    });
  },
  // 处理搜索按钮点击事件
  handleSearch() {
    const keyword = this.data.inputValue.trim();
    this.doSearch(keyword);
  },
  // 处理每个分类按钮点击事件
  handleCategoryTap(e) {
    const category = e.currentTarget.dataset.name;
    this.setData({
      currentCategory: category,
      categoryResults: []
    });
    // 调用分类搜索API
    wx.request({
      url: 'http://156.233.233.164:5555//search',
      data: {
        kw: category,
        page: 1,
        size: 10
      },
      success: res => {
        const results = (res.data.data || []).map(item => {
          // 根据文件扩展名确定类型
          let type = 'doc';
          if (item.filename) {
            const ext = item.filename.split('.').pop().toLowerCase();
            if (['mp4', 'avi', 'mkv'].includes(ext)) type = 'movie';
            else if (['pdf', 'epub', 'mobi'].includes(ext)) type = 'book';
            else if (['mp3', 'wav', 'flac'].includes(ext)) type = 'music';
            else if (['exe', 'dmg', 'apk'].includes(ext)) type = 'app';
            else if (['zip', 'rar', '7z'].includes(ext)) type = 'zip';
          }

          // console.log('File type detected:', type, 'for file:', item.filename);
          return {
            ...item,
            displayText: item.searchtext || item.title || item.filename,
            createtime: item.createtime ? item.createtime.split(' ')[0].replace(/-/g, '.') : '未知时间',
            source: item.course || '未知来源',
            type: type,
            _iconPath: `../../assets/icons/${type}.svg`
          };
        });
        this.setData({ categoryResults: results });
      },
      fail: err => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },
  // 处理热门关键词点击跳转，将关键词传输到搜索结果页
  handleHotKeywordTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ inputValue: keyword });
    this.doSearch(keyword);
  },
  // 处理历史关键词点击跳转，将关键词传输到搜索结果页
  handleHistoryItemTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ inputValue: keyword });
    this.doSearch(keyword);
  },
  // 删除单个历史记录
  handleDeleteHistory(e) {
    e.stopPropagation();
    const index = e.currentTarget.dataset.index;
    let history = this.data.history;
    history.splice(index, 1);
    this.setData({ history });
    wx.setStorageSync('searchHistory', history);
  },
  // 清除所有历史记录
  handleClearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清除所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          wx.removeStorageSync('searchHistory');
        }
      }
    });
  },
  // 点击调用微信setClipboardData API复制链接
  copyLink(e) {
    const link = e.currentTarget.dataset.link;
    wx.setClipboardData({
      data: link,
      success: () => wx.showToast({ title: '链接已复制' })
    });
  },
  // 点击调用微信setClipboardData API，复制链接并打开夸克小程序
  previewResource(e) {
    const url = e.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({
          title: '链接已复制，即将打开夸克',
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => {
          wx.navigateToMiniProgram({
            appId: 'wx2f9b06c1de1ccfca', // 夸克小程序appId
            path: '',
            extraData: {},
            success(res) {
              console.log('打开夸克成功', res)
            },
            fail(err) {
              console.error('打开夸克失败', err)
            }
          });
        }, 2000);
      }
    });
  }
});
