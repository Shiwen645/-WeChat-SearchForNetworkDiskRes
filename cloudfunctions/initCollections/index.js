// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const { collectionName } = event

  try {
    // 检查集合是否存在
    await db.collection(collectionName).count()
    return { success: true, exists: true }
  } catch (e) {
    // 集合不存在则创建
    try {
      await db.createCollection(collectionName)
      // 添加简单索引
      if (collectionName === 'favorites') {
        await db.collection(collectionName).createIndex({
          articleId: 1,
          userId: 1
        })
      }
      return { success: true, exists: false }
    } catch (err) {
      return { success: false, error: err }
    }
  }
}
