var concat = require('concat-stream')
var hyperquest = require('hyperquest')
var once = require('once')

module.exports = function (href, opts, cb) {
  cb = once(cb || noop)
  var headers = {}
  if (opts.lastModified) headers['Last-Modified-Since'] = opts.lastModified
  if (opts.etag) headers['If-None-Match'] = opts.etag
  var r = hyperquest(href, { headers: headers })
  var extra = {}, pending = 2, html = null
  r.once('response', function (res) {
    if (res.headers.etag) extra.etag = res.headers.etag
    if (res.headers['last-modified']) { 
      extra.lastModified = res.headers['last-modified']
    }
    done()
  })
  r.once('error', cb)
  r.pipe(concat(function (body) {
    html = body
    done()
  }))
  function done () {
    if (--pending === 0) cb(null, html, extra)
  }
}

function noop () {}
