const express = require('express')
const app = express()
const port = 5555

// 模拟网盘数据
const mockData = [
  {
    id: 1,
    title: 'JavaScript高级程序设计',
    filename: 'JavaScript高级程序设计.pdf',
    searchtext: '前端开发必读',
    course: '前端课程',
    filetype: 'doc',
    updatetime: '2025-05-10 10:00:00',
    size: '5.2MB',
    link: 'https://example.com/file1',
    url: 'https://example.com/preview/file1'
  },
  {
    id: 2,
    title: 'Vue3实战视频',
    filename: 'Vue3实战.mp4',
    searchtext: 'Vue3全套教程',
    course: 'Vue课程',
    filetype: 'movie',
    updatetime: '2025-05-15 14:30:00',
    size: '1.2GB',
    link: 'https://example.com/file2',
    url: 'https://example.com/preview/file2'
  }
]

// 搜索接口
app.get('/search', (req, res) => {
  const { kw, page = 1, size = 10 } = req.query
  const filtered = mockData.filter(item =>
    item.title.includes(kw) ||
    item.searchtext.includes(kw))
  const start = (page - 1) * size
  const end = start + size
  const result = filtered.slice(start, end)

  res.json({
    code: 0,
    data: result,
    total: filtered.length
  })
})

// 启动服务
app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`)
})
