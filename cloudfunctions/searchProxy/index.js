const cloud = require('wx-server-sdk')
cloud.init()
const rp = require('request-promise')

exports.main = async (event) => {
  const { kw, page = 1, size = 10 } = event

  try {
    // 替换为您的云端API地址（HTTP/HTTPS）
    const apiUrl = 'https://shiwen645.icu/search'
    const result = await rp({
      uri: apiUrl,
      qs: { kw, page, size },
      json: true
    })

    return { code: 0, data: result.data || [] }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
