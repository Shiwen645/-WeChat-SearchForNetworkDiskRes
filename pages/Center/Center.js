// pages/Center/Center.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    article: null, //用户数据
    displayTime: '',//获取该内容发布的时间
    isFavorited: false, //是否收藏
    favoriteCount: 0,//收藏数
    comments: [],//评论数据
    newComment: '',//写评论的输入框中的value
    replyTo: null,//对xxx的回复
    showCommentInput: false//评论或回复框输入框是否显示
  },

  /**
   * 生命周期函数--监听页面加载
   */
  /**
   * 页面加载时触发
   * @param {Object} options 页面参数
   */
  // 在跳转之后立即调用getArticleDetail弹出加载模态框
  onLoad(options) {
    if (options.id) {
      this.getArticleDetail(options.id);//获取文章详情,options.id是获取的点击的文章的id
      this.loadComments();//加载评论和回复 获取当前文章的所有评论及其回复
      this.updateFavoriteStatus();//更新收藏状态 查询当前用户是否收藏及总收藏数
    }
  },

  /**
   * 获取文章详情
   * @param {string} id //文章ID
   */
  // 上面的调用
  async getArticleDetail(id) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('articles')
        .where({
          // 查询与点击的id对应的数据的id
          id: id
        })
        // 查询调用
        .get();
        // 判断res查询id之后所对应的id是否大于0
      if (res.data.length > 0) {
        const article = res.data[0];
        this.setData({
          article: article,
          // 对article中的time进行格式化
          displayTime: new Date(article.time).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        });
        // 若查询等于0，弹出模态框然后在1.5秒后消失
      } else {
        wx.showToast({
          title: '文章不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
      // 查询错误的调用
    } catch (err) {
      console.error('获取文章详情失败:', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      // 无论加载成功还是失败，都会调用hideLoadingAPI把加载动画关闭
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },



  /**
   * 复制链接到剪贴板
   * @param {Object} e 点击事件对象
   */
  // 点击获取Link链接
  copyLink(e) {
    const link = e.currentTarget.dataset.link;
    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 切换收藏状态
   * 检查登录状态后，添加/移除收藏记录
   */
  async toggleFavorite() {
    // 没有登录即弹出模态框提示登录
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    // 点击收藏后而且已登录时的收藏处理，弹出提示框
    wx.showLoading({ title: '处理中...' });
    try {
      // 拿到用户的id
      const db = wx.cloud.database();
      // app.js中的userId
      const userId = getApp().globalData.userId;
      // 该页面中用户的id
      const articleId = this.data.article.id;

      if (this.data.isFavorited) {
        // 取消收藏，删除对应收藏的文章id
        await db.collection('favorites').where({
          articleId: articleId,
          userId: userId
        }).remove();
      } else {
        // 添加收藏
        await db.collection('favorites').add({
          data: {
            articleId: articleId,
            userId: userId,
            createdAt: new Date()
          }
        });
      }
      await this.updateFavoriteStatus();
    } catch (err) {
      console.error('操作失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 更新收藏状态
   * 查询当前用户是否收藏及总收藏数
   */
  async updateFavoriteStatus() {
    const db = wx.cloud.database();
    const userId = getApp().globalData.userId;
    const articleId = (this.data.article && this.data.article.id) || 'defaultId';
    // 检查是否已收藏
    const favorRes = await db.collection('favorites').where({
      articleId: articleId,
      userId: userId
    }).count();

    // 获取收藏总数
    const countRes = await db.collection('favorites').where({
      articleId: articleId
    }).count();

    this.setData({
      isFavorited: favorRes.total > 0,
      favoriteCount: countRes.total
    });
  },

  /**
   * 切换评论输入框显示/隐藏
   */
  toggleCommentInput() {
    this.setData({
      showCommentInput: !this.data.showCommentInput,
      replyTo: null,
      newComment: ''
    });
  },

  /**
   * 处理评论输入
   * @param {Object} e 输入事件对象
   */
  onCommentInput(e) {
    this.setData({
      newComment: e.detail.value
    });
  },

  /**
   * 显示回复输入框
   * @param {Object} e 点击事件对象
   */
  showReplyInput(e) {
    // 拿到被回复的评论
    const comment = e.currentTarget.dataset.comment;
    this.setData({
      showCommentInput: true,
      // 指定评论进行回复
      replyTo: {
        id: comment._id,
        username: comment.user.nickName
      },
      newComment: ''
    });
  },

  /**
   * 提交评论或回复
   * 将评论/回复内容保存到数据库
   */
  async submitComment() {
    // 判断输入是否为空
    if (!this.data.newComment.trim()) return;

    wx.showLoading({ title: '提交中...' });
    try {
      const db = wx.cloud.database();
      // app.js中用户登录的信息
      const userInfo = getApp().globalData.userInfo;
      // 处理用户输入的信息和用户的信息
      const commentData = {
        content: this.data.newComment,
        articleId: this.data.article.id,
        user: {
          nickName: userInfo.nickName,
          avatar: userInfo.avatarUrl
        },
        createdAt: new Date(),
        displayTime: '刚刚'
      };

      if (this.data.replyTo) {
        // 添加回复
        await db.collection('replies').add({
          data: {
            ...commentData,
            commentId: this.data.replyTo.id
          }
        });
      } else {
        // 添加评论
        await db.collection('comments').add({
          data: commentData
        });
      }
      // 初始化输入框
      this.setData({
        newComment: '',
        replyTo: null
      });
      await this.loadComments();
    } catch (err) {
      console.error('提交失败:', err);
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 加载评论和回复
   * 获取当前文章的所有评论及其回复
   */
  async loadComments() {
    try {
      const db = wx.cloud.database();
      // 获取所有的评论以及回复
      const commentsRes = await db.collection('comments')
        .where({
          articleId: this.data.article.id
        })
        // 利用orderBy方法进行排序（按时间倒排）
        .orderBy('createdAt', 'desc')
        .get();

      // 获取每条评论的回复
      const commentsWithReplies = await Promise.all(
        commentsRes.data.map(async comment => {
          const repliesRes = await db.collection('replies')
            .where({
              commentId: comment._id
            })
            // 正序
            .orderBy('createdAt', 'asc')
            .get();
          return {
            // 返回用户的信息和评论内容
            ...comment,
            replies: repliesRes.data
          };
        })
      );

      this.setData({
        // 将返回的用户的信息和评论内容赋值给comments
        comments: commentsWithReplies
      });
    } catch (err) {
      console.error('加载评论失败:', err);
    }
  },

  /**
   * 格式化时间显示
   * @param {Date} date 需要格式化的日期
   * @return {string} 格式化后的时间字符串
   */
  formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
    return new Date(date).toLocaleDateString('zh-CN');
  }
})
