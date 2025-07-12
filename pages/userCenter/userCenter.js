// const { try } = require("bluebird");

// pages/userCenter/userCenter.js
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    // 不再自动更新登录状态
    app.getCurrentPage = () => this;
  },

  onShow() {
    this.updateLoginStatus();
  },

  onLogin() {
    this.updateLoginStatus();
  },

  onLogout() {
    this.updateLoginStatus();
  },

  async updateLoginStatus() {
    let favoritesCount = '0'
    let postsCount = '0'

    if (app.globalData.isLoggedIn) {
      favoritesCount = await this.getFavoritesCount()
      postsCount = await this.getPostsCount()
    }

    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo,
      stats: [
        { label: '收藏', value: favoritesCount },
        { label: '我的发布', value: postsCount }
      ],
      features: [
        { name: '我的收藏', icon: 'favor',url:"" },
        { name: '设置', icon: 'setting',url:"" }
      ]
    });
  },
  // 获取用户信息
  getUserProfile(e) {
    if (!e.detail.userInfo) {
      wx.showToast({
        title: '请先授权用户信息',
        icon: 'none'
      });
      return;
    }

    // 直接使用e.detail中的用户信息
    app.globalData.userInfo = e.detail.userInfo;
    app.checkLoginStatus();
  },

  // 获取收藏数量
  async getFavoritesCount() {
    try {
      const db = wx.cloud.database()
      // 首先检查收藏集合是否存在
      await db.collection('favorites').count() //集合的长度.total
      const res = await db.collection('favorites')
        .where({
          _openid: app.globalData.openid
        })
        .count()
      return res.total
      // 如果失败控制台输出
    } catch (e) {
      console.error('获取收藏数量失败:', e)
      // 如果集合不存在，创建默认集合
      try {
        // 调用initCollection云函数
        await wx.cloud.callFunction({
          name: 'initCollection',
          data: {
            collectionName: 'favorites'
          }
        })
        return '0'
      } catch (initErr) {
        console.error('初始化收藏集合失败:', initErr)
        return '0'
      }
    }
  },

  // 获取发布数量res.total
  async getPostsCount() {
    try {
      const db = wx.cloud.database()
      const res = await db.collection('articles')
        .where({
          _openid: app.globalData.openid
        })
        .count()
      return res.total
    } catch (e) {
      console.error('获取发布数量失败:', e)
      return '0'
    }
  },
  async navigateTo(e){
    try {
      if(e.target.offsetLeft === 95 && e.target.offsetTop === 273){
        wx.navigateTo({
          url: '/pages/collection/collection',
        })
      }else if(e.target.offsetLeft === 265 && e.target.offsetTop === 273){
        wx.navigateTo({
          url: '/pages/Setup/Setup',
        })
      }
    }catch(e){
      return console.log("获取索引错误");
    }
  },
  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  }
});
