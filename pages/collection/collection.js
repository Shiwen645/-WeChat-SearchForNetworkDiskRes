// pages/favorites/favorites.js
Page({
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
})