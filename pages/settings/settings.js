Page({
  data: {
    form: { //表单数据，最终上传到数据库
      title: '',
      content: '',
      link: '',
      linkText: ''
    },
    resourceTypes: ['文档', '视频', '音频', '图片', '压缩包'],//文件类型分类
    isSubmitting: false //处理发布按钮是否禁用
  },

  // 表单输入处理
  handleInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  // 资源类型选择
  handlePickerChange(e) {
    this.setData({
      // 选择数据类型赋值到from对象的linkText中
      'form.linkText': this.data.resourceTypes[e.detail.value]
    })
  },

  // 表单提交
  formSubmit() {
    // 如果按钮被禁用了，就不能点击发布
    if (this.data.isSubmitting) return

    this.setData({
      isSubmitting: true
    })
    // 将填写的表单的数据各个赋值到from对象的每个属性中
    const { title, content, link, linkText } = this.data.form
    // 如果标题和内容为空，则弹出提示框并且恢复按钮点击
    if (!title || !content) {
      this.setData({
        isSubmitting: false
      })
      wx.showToast({
        title: '请填写标题和内容',
        icon: 'none'
      })
      return
    }
    // 正则验证链接格式是否正确
    if (link && !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(link)) {
      wx.showToast({
        title: '请输入有效的链接地址',
        icon: 'none'
      })
      return
    }

    const newArticle = {
      id: Date.now().toString(),
      title,
      content,
      link: link || '',
      linkText: linkText || '资源链接',
      author: '当前用户',
      avatar: '/assets/icons/user.jpg',
      time: new Date().toLocaleDateString()
    }

    //getCurrentPages用于获取当前页面栈的信息 获取全局文章数据并添加新文章
    const pages = getCurrentPages()
    // 获取社区页面
    const detailPage = pages.find(page => page.route === 'pages/detail/detail')
    if (detailPage) {
      // 调用社区页面的addNewArticle方法将newArticle数据添加到数据库
      detailPage.addNewArticle(newArticle)
    }

    // 将articles存储到本地
    let articles = wx.getStorageSync('articles') || []
    articles.unshift(newArticle)
    wx.setStorageSync('articles', articles)

    // 先显示成功提示
    wx.showToast({
      title: '发布成功',
      icon: 'success',
      success: () => {
        // 延迟500ms确保toast显示完整
        setTimeout(() => {
          this.setData({
            isSubmitting: false
          })
          wx.navigateBack()
        }, 500)
      }
    })
  }
})
