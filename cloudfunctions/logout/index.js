const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { userId } = event

  // 这里可以添加退出时的业务逻辑
  // 比如记录退出时间、清除会话等

  return {
    code: 0,
    message: '退出成功'
  }
}
