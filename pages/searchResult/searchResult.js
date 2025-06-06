const defaultData = require('../../utils/defaultData')
const app = getApp()

Page({
  data: {
    keyword: '', //搜索关键字
    results: [], //渲染的数组,API响应回来的数据存放在这里
    defaultResults: defaultData, //'../../utils/defaultData'中的默认内容
    loading: false, //是否加载
    hasMore: true, // true显示暂无搜索结果，换个关键词试试,因为loading默认为false,false则显示~ 已经到底啦 ~
    page: 1, //页数
    showDefault: false //是否展示内容区，若为true，则显示默认内容
  },
  // app.globalData.searchKeyword可以访问全局的数据
  onLoad() {
    const app = getApp(); //调用全局函数和数据的API，此处的关键字作用于全局，任何一个地方的关键字传输进来就渲染该关键字的内容
    if (app.globalData.searchKeyword) {
      this.setData({
        keyword: app.globalData.searchKeyword
      }, () => {
        this.doSearch();
      });
    }
  },
  // 监听页面显示钩子
  onShow() {
    const app = getApp();//调用全局函数和数据
    // 解决主页面搜索与搜索页面搜索关键字的冲突问题，如果全局中有任何一个地方再继续搜索，关键字替换为别的地方的关键字
    if (app.globalData.searchKeyword &&
      app.globalData.searchKeyword !== this.data.keyword) {
      this.setData({
        keyword: app.globalData.searchKeyword
      }, () => {
        this.doSearch();
      });
    }
  },
  // 处理输入框加载，若输入为空弹出模态框提示-请输入关键词
  doSearch() {
    if (!this.data.keyword.trim()) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      this.setData({ showDefault: true });
      return;
    }
    // 处理加载是否为true，调用API加载函数，调用API响应内容
    this.setData({
      loading: true,
      page: 1,
      results: [],
      showDefault: false
    });
    this.loadData();
  },
  // APi响应内容函数（微信开发小程序内置API：request）
  loadData() {
    wx.request({
      url: 'http://156.233.233.164:5555/search',
      data: {
        kw: this.data.keyword, //搜索关键词
        page: this.data.page, // 搜索页数
        size: 10 //每次搜索加载的内容数量
      },
      success: res => {
        const newData = (res.data.data || []).map(item => ({
          ...item,
          // displayText: item.searchtext || item.title || item.filename
        }));
        // 如果API响应的内容长度为0并且页数为1，则不显示API响应内容，从而响应默认内容
        if (newData.length === 0 && this.data.page === 1) {
          this.setData({ showDefault: true });
        }

        this.setData({
          results: this.data.page === 1
            ? newData
            : [...this.data.results, ...newData],
          hasMore: newData.length >= 10,
          loading: false
        });
      },
      fail: err => {
        if (this.data.page === 1) {
          this.setData({ showDefault: true });
        }
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      }
    });
  },

  // 得到输入框中的值
  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },
  // 清空输入框中的值
  clearInput() {
    this.setData({ keyword: '' });
  },
  // 获取时间方法(暂没有解决方法)
  // formatTime(timeStr) {
  //   return timeStr ? timeStr.split(' ')[0] : '';
  // },

  // 复制链接失败时弹出的模态框
  copyLink(e) {
    const link = e.currentTarget.dataset.link;
    if (!link) {
      wx.showToast({
        title: '无效链接',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('复制失败:', err);
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  // 复制链接并且跳转至夸克小程序(调用setClipboardData微信API进行复制)并且弹出模态框
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
        // 2s后跳转,appid为夸克小程序的appid(暂时没有夸克小程序,因此豆瓣appid代为跳转)
        setTimeout(() => {
          wx.navigateToMiniProgram({
            appId: 'wx2f9b06c1de1ccfca', // 豆瓣appId
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
  },
  // page代表第x页，每往下加载就页数加一
  loadMore() {
    if (!this.data.loading && this.data.hasMore) {
      this.setData({
        page: this.data.page + 1,
        loading: true
      });
      this.loadData();
    }
  }
});
