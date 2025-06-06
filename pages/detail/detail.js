Page({
  data: {
    articles: [], //需要渲染的数据
    swiperImages: [
      'http://156.233.233.164:8090/upload/4a4f3471882f11ebb6edd017c2d2eca2.png',
      'http://156.233.233.164:8090/upload/75f623625ac54b1c8278ce060d07b546.jpg',
      'http://156.233.233.164:8090/upload/1166283-zAcQ.jpg'
    ] //每个轮播图的链接
  },

  onLoad() {
    this.initStorage()

    // const articles = wx.getStorageSync('articles')
    // 加载页面
    this.loadArticles()
  },

  // 初始化云数据库
  async initStorage() {
    // 开始初始化云数据库
    try {
      // 云数据库的初始化
      const db = wx.cloud.database()
      // 检查数据
      let res
      try {
        //  统计所有文章数量
        res = await db.collection('articles').count()
        // console.log('云数据库文章数量:', res.total)
      } catch (e) {
        // 无法找到articles集合或查询失败弹出模态框
        wx.showToast({
          title: '请先在云开发控制台创建articles集合',
          icon: 'none',
          duration: 3000
        })
        return
      }
      // 如果集合中的数据为0个，则创建默认数据
      if (res.total === 0) {
        const defaultArticles = [
          {
            id: '1',
            title: '分享一个好用的网盘资源',
            content: '最近发现一个非常好用的网盘资源，里面有很多免费的学习资料，分享给大家...',
            author: '张三',
            avatar: 'http://156.233.233.164:8090/upload/user.jpg',
            time: '2025.05.15',
            link: 'https://example.com/pan/123',
            linkText: '点击获取资源'
          }
        ]

        // 单条插入默认数据,将上面的defaultArticles循环插入到article中(数据库中没有article集合的情况下)
        for (const article of defaultArticles) {
          // 添加发布时间字段
          const newArticle = {
            ...article,
            time: new Date().toISOString()
          }
          // 异步添加到数据库中
          await db.collection('articles').add({
            data: newArticle
          })
        }

        // 添加简单索引优化查询
        try {
          await db.collection('articles').createIndex({
            // 添加参数id,且值为1
            id: 1
          })
          // 若插入失败则控制台输出
        } catch (e) {
          console.log('索引可能已存在:', e)
        }
      }
      // 若插入失败则控制台输出然后弹出模态框
    } catch (e) {
      console.error('云数据库操作出错:', e)
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
    }
  },

  // 从云数据库加载文章列表
  async loadArticles() {
    try {
      const db = wx.cloud.database()
      // 数据库调用的集合数据赋值到res
      const res = await db.collection('articles')
        .orderBy('time', 'desc')
        .get()
      // 将res数据赋值到articles进行渲染
      let articles = res.data || []
      // 确保数据按时间倒序排列,确保最新消息在最顶部
      articles.sort((a, b) => new Date(b.time) - new Date(a.time))
      // 预处理文章内容(改变原数据的内容格式)
      articles = articles.map(item => {
        return {
          ...item,
          preview: (item.content || '').substring(0, 30) + '...',
          displayTime: new Date(item.time).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
        }
      })
      // console.log('从云数据库加载的文章数据:', articles)
      // 将最终的数据解构赋值给data中的articles数组
      this.setData({ articles })
    } catch (e) {
      console.error('加载文章失败:', e)
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      })
    }
  },

  // 点击文章查看文章详情
  viewArticle(e) {
    const id = e.currentTarget.dataset.id
    // 调用navigateTo微信API跳转到Center详情页面
    wx.navigateTo({
      url: `/pages/Center/Center?id=${id}`,
      success: () => console.log('跳转成功'),
      // 跳转失败响应到控制台然后弹出模态框
      fail: (err) => {
        console.error('跳转失败:', err)
        wx.showToast({
          title: '跳转失败，请检查页面是否存在',
          icon: 'none'
        })
      }
    })
  },
  // 点击复制链接API弹出模态框
  copyLink(e) {
    const link = e.currentTarget.dataset.link
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 点击加号图标跳转到发布页面
  toPublish() {
    const app = getApp()
    // 判断全局中的isLoggedIn数据，若isLoggedIn为true则弹出登录提示，确定即跳转至登录页面
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后才能发布内容',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/userCenter/userCenter'
            })
          }
        }
      })
      return
    }
    // 若已经登录点击则跳转发布页面
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },
  
  // 添加新文章到云数据库
  async addNewArticle(article) {
    try {
      const db = wx.cloud.database()
      const app = getApp()

      // 从数据库获取当前用户信息
      const userRes = await db.collection('users')
        .where({
          _openid: app.globalData.openid
        })
        .get()

      const user = userRes.data[0] || {}

      // 添加用户信息和时间戳
      const newArticle = {
        ...article,
        author: user.nickName || '匿名用户',
        avatar: user.avatarUrl || 'http://156.233.233.164:8090/upload/user.jpg',
        time: new Date().toISOString(),
        displayTime: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      }
      // 将用户添加到数据库中
      await db.collection('articles').add({
        data: newArticle
      })
      // 强制重新加载loadArticles()函数并重置页面数据（实现响应式）
      await this.loadArticles()
      // 将articles重新赋值
      this.setData({
        articles: this.data.articles
      })
      // 弹出模态框
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      // 失败的情况
    } catch (e) {
      console.error('添加文章失败:', e)
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
    }
  }
})
