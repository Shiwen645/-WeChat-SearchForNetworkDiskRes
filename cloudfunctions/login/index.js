// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { userInfo } = event
  const db = cloud.database()
  const users = db.collection('users')

  // 检查用户是否已存在
  const { data } = await users.where({
    openid: cloud.getWXContext().OPENID
  }).get()

  if (data.length > 0) {
    // 用户已存在，更新信息
    await users.doc(data[0]._id).update({
      data: {
        ...userInfo,
        lastLoginTime: db.serverDate()
      }
    })
    return {
      code: 200,
      message: '登录成功',
      userInfo: {
        ...data[0],
        ...userInfo
      }
    }
  } else {
    // 新用户，创建记录
    const res = await users.add({
      data: {
        ...userInfo,
        openid: cloud.getWXContext().OPENID,
        createTime: db.serverDate(),
        lastLoginTime: db.serverDate()
      }
    })
    return {
      code: 200,
      message: '注册成功',
      userInfo: {
        ...userInfo,
        _id: res._id
      }
    }
  }
}
