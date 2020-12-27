import db from './db.js'
import Http from 'esc-ui/lib/http'

const http = new Http({
  baseUrl: '',
  urlMap: {
    upload: '/upload'
  },
  contentType: 'application/json'
})

export default function () {
  console.log('http: client api')

  db.init()

  db.addArticle = data => {
    const article = db.initTables('Article', data.id)
    Object.keys(data).forEach(key => {
      if (key !== 'id') {
        article.set(key, data[key])
      }
    })
    return article.save()
  }

  db.delArticle = data => {
    const article = db.initTables('Article', data.id)
    return article.destroy()
  }

  db.uploadImg = data => {
    // return new db.AV.File(data.name, data).save({
    //   onprogress(e) {
    //     data.cb(e.percent)
    //   }
    // })
    return http.post('upload', data)
  }

  db.totalCount = () => {
    return new db.AV.Query('Article').count()
  }

  return db
}
