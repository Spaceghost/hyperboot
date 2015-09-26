var http = require('http')
var fs = require('fs')
var path = require('path')
var ecstatic = require('ecstatic')

var dir = path.join(process.argv[2], '.hyperboot')
var st = ecstatic(dir)

var server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.url === '/') {
    fs.readlink(path.join(dir, 'index.html'), function (err, link) {
      if (err) return error(500, res, err.message)
      res.statusCode = 302
      res.setHeader('Location', link)
      res.end()
    })
  } else st(req, res)
})
server.listen(8001)

function error (code, res, msg) {
  res.statusCode = code
  res.end(msg)
}
