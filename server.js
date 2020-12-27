const express = require('express')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const compression = require('compression')
const resolve = file => path.resolve(__dirname, file)
const favicon = require('serve-favicon')
const LRU = require('lru-cache')
const { createBundleRenderer } = require('vue-server-renderer')
const githubImage = require('github-image')
const dayjs = require('dayjs')
const log4js = require('log4js')
const AV = require('leancloud-storage')
const appId = 'iYzWnL2H72jtQgNQPXUvjFqU-gzGzoHsz'
const appKey = 'OR3zEynwWJ7f8bk95AdiGFzJ'
const serverURLs = 'https://api.iming.work'
AV.init({ appId, appKey, serverURLs })

const isProd = process.env.NODE_ENV !== 'development'
const serverInfo = `express/${require('express/package.json').version} ` +
  `vue-server-renderer/${require('vue-server-renderer/package.json').version}`

const app = express()
const log = log4js.getLogger()

console.log('isProd', isProd, process.argv[2] === '-dev')
function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    // for component caching
    // cache: LRU({
    //   max: 1000,
    //   maxAge: 1000 * 60 * 15
    // }),
    // this is only needed when vue-server-renderer is npm-linked
    basedir: resolve('./dist'),
    // recommended for performance
    runInNewContext: false
  }))
}

let renderer
let readyPromise
let templatePath = resolve('./src/index.template.html')
if (isProd) {
  const bundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync(templatePath, 'utf-8')
  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
} else {
  readyPromise = require('./build/setup-dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )
}

// page cache
const microCache = LRU({
  max: 100,
  maxAge: 1000 * 60 * 15
})
const isCacheable = req => {
  const isDetailApi = /^\/detail\/[a-z0-9]+$/.test(req.originalUrl)
  // console.log(isDetailApi)
  return /^\/(detail|list|$)/.test(req.originalUrl) && !isDetailApi
}
const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache && isProd ? 1000 * 60 * 60 * 24 : 0
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(compression({ threshold: 0 }))
app.use(favicon('./public/logo.jpg'))
app.use('/dist', serve('./dist', true))
app.use('/public', serve('./public', true))
app.use(log4js.connectLogger(log4js.getLogger('http'), { level: 'auto' }))

function render(req, res) {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Server', serverInfo)

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if(err.code === 404) {
      res.status(404).send(
        '<p style="font-size: 50px;text-align: center; padding-top: 100px; color: #666;">404 | Page Not Found</p>'
      )
    } else {
      // Render Error Page or Redirect
      res.status(500).send('500 | Internal Server Error')
      log.error(`error during render : ${req.url}`)
      log.error(err.stack)
    }
  }

  const now = Date.now()
  const context = {
    url: req.url
  }

  // renderer.renderToStream(context)
  //   .on('error', handleError)
  //   .on('end', () => console.log(`whole request: ${Date.now() - now}ms`))
  //   .pipe(res)
  renderer.renderToString(context, (err, html) => {
    if (isCacheable(req)) {
      microCache.set(req.url, html)
    }

    if (err) {
      return handleError(err)
    }
    res.send(html)
    // if (!isProd) {
    log.debug(`whole request: ${Date.now() - now}ms`)
    // }
  })
}

// -------------------------------------------------------
// Api for upload github images
// -------------------------------------------------------

app.post('/upload', async (req, res) => {
  // Github 会扫描公共仓库，找到的 token 会被删掉
  githubImage.setConfig('8650992d13594%%f6992f820d04aa0a7471a48377a'.replace('%%', ''), 'jmingzi/blog-image', dayjs().format('YYYY-MM-DD'))
  githubImage.uploadBase64(req.body.base64, `the_parsed_crop_image.${Date.now()}.png`, req.body.commit || 'unknow_article_title').then(result => {
    res.status(200).send({ success: true, data: result })
  }).catch(err => {
    res.status(200).send({ success: false, msg: err.message })
  })
})


// -------------------------------------------------------
// Api for login and sitemap
// -------------------------------------------------------
const domain = 'https://iming.work'
let redirectUrl = domain
app.get('/github', async (req, res) => {
  redirectUrl = decodeURIComponent(req.query.href)
  console.log(redirectUrl)
  res.redirect(`https://github.com/login/oauth/authorize?client_id=fd499caa8b7738da9ec4&redirect_uri=${domain}/oauth/redirect`)
})

app.get('/sitemap', (req, res) => {
  require('child_process').execFile('node', ['gen-sitemap.js'], (err, stdout) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(stdout || '执行成功！')
    }
  })
})

app.get('/robots.txt', function (req, res, next) {
  var options = {
    root: path.join(__dirname),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  // var fileName = req.params.name
  res.sendFile('robots.txt', options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent: robots.txt')
    }
  })
})

app.get('/sitemap.xml', function (req, res, next) {
  var options = {
    root: path.join(__dirname),
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  // var fileName = req.params.name
  res.sendFile('sitemap.xml', options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent: sitemap.xml')
    }
  })
})

app.get('/cookie/clear', (req, res) => {
  res.clearCookie('_login')
  res.status(200).send()
})

app.get('/weather', async (req, res) => {
  // const city = req.query.city
  const { data: { result } } = await axios({
    url: 'http://api.k780.com:88/?app=weather.future&weaid=94&appkey=10003&sign=b59bc3ef6191eb9f747dd4e83c99f2a4&format=json'
  }).catch(err => {
    res.status(500).send(err)
  })
  res.status(200).send({ data: result, success: true })
})

app.get('/oauth/redirect', async (req, res) => {
  res.type('application/json')

  const { data: { access_token } } = await axios({
    url: `https://github.com/login/oauth/access_token?client_id=fd499caa8b7738da9ec4&client_secret=9350d2b4bdc72e1e8cabb6db3f85b01b34ea0129&code=${req.query.code}`,
    method: 'post',
    headers: {
      accept: 'application/json'
    }
  })

  let userRes
  if (access_token) {
    userRes = await axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {
        accept: 'application/json',
        Authorization: `token ${access_token}`
      }
    })
    const { login, node_id, email } = userRes.data
    const user = new AV.User()
    user.setUsername(login)
    user.setPassword(node_id)
    user.setEmail(email)
    user.set('github', userRes.data)
    const _redirect = () => {
      res.cookie('_login', login, { expires: new Date(Date.now() + 60000) })
      res.redirect(redirectUrl)
      redirectUrl = undefined
    }

    try {
      await user.signUp()
      _redirect()
    } catch (e) {
      if (e.code === 202) {
        // 已存在
        _redirect()
      } else {
        res.status(500).send({ success: false, data: e })
      }
    }
  }
})

app.get('*', (req, res) => {
  if (isCacheable(req)) {
    const hit = microCache.get(req.url)
    if (hit) {
      log.info(`cache: ${req.url}`)
      return res.end(hit)
    }
  }

  log.debug(`access: ${req.url}`)
  if (isProd) {
    render(req, res)
  } else {
    readyPromise.then(() => render(req, res))
  }
})

module.exports = app
