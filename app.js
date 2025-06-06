// app.js
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-3g2x8m7745c87a39',
      traceUser: true
    });

    // 不再自动检查登录状态
  },
  // 用户登录信息
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    userId: null,
    searchKeyword: ''
  },

  // 退出登录
  logout() {
    const that = this;

    // 调用logout云函数先通知用户退出
    wx.cloud.callFunction({
      name: 'logout',
      data: {
        userId: this.globalData.userId
      },
      success(res) {
        console.log('退出成功', res);
        // 无论云端退出是否成功，都执行本地退出并且清空用户信息
        that.globalData.userInfo = null;
        that.globalData.isLoggedIn = false;
        that.globalData.userId = null;

        // 清除本地存储
        try {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userId');
        } catch (e) {
          console.error('清除存储失败', e);
        }

        // 通知所有页面更新状态
        if (typeof that.getCurrentPage === 'function') {
          const page = that.getCurrentPage();
          if (page && page.onLogout) {
            page.onLogout();
          }
        }
      },
      fail(err) {
        console.error('退出失败', err);
        // 即使云函数失败也执行本地退出
        that.globalData.userInfo = null;
        that.globalData.isLoggedIn = false;
        that.globalData.userId = null;

        // 清除本地存储
        try {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userId');
        } catch (e) {
          console.error('清除存储失败', e);
        }
      }
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const that = this;
    // 检查用户是否已授权某项权限API
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接获取用户信息API
          wx.getUserInfo({
            success(res) {
              that.globalData.userInfo = res.userInfo;
              that.globalData.isLoggedIn = true;
              // 传入用户信息
              that.loginToCloud(res.userInfo);

              // 通知所有页面更新状态
              if (typeof that.getCurrentPage === 'function') {
                const page = that.getCurrentPage();
                if (page && page.onLogin) {
                  page.onLogin();
                  
                }
              }
            }
          })
        }
      }
    })
  },

  // 云开发登录
  loginToCloud(userInfo) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    const that = this;
    // 调用login登录云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {
        // 信息传入
        userInfo: userInfo
      },
      success(res) {
        // console.log('云函数调用成功', res);
        // 关闭加载提示框
        wx.hideLoading();

        if (res.result) {
          // 存储用户信息到全局
          that.globalData.userInfo = res.result.userInfo;
          that.globalData.userId = res.result.userInfo._id;
          that.globalData.isLoggedIn = true;

          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          // 通知所有页面更新状态
          if (typeof that.getCurrentPage === 'function') {
            const page = that.getCurrentPage();
            if (page && page.updateLoginStatus) {
              page.updateLoginStatus();
            }
          }
        } else {
          wx.showToast({
            title: '登录信息异常',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('云函数调用失败', err);
        // 关闭加载提示框
        wx.hideLoading();

        // 即使云函数失败也允许本地登录
        that.globalData.userInfo = userInfo;
        that.globalData.isLoggedIn = true;

        wx.showToast({
          title: '本地登录成功(云服务异常)',
          icon: 'none'
        });
        // 通知所有页面更新状态
        if (typeof that.getCurrentPage === 'function') {
          const page = that.getCurrentPage();
          if (page && page.updateLoginStatus) {
            page.updateLoginStatus();
          }
        }
      }
    });
  }
});
