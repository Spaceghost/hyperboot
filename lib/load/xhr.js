var xhr = require('xhr')
module.exports = function loader (href, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  var headers = {}
  if (opts.lastModified) headers['If-Modified-Since'] = opts.lastModified
  if (opts.etag) headers['If-None-Match'] = opts.etag
  var xopts = {
    method: 'GET',
    url: href,
    headers: headers
  }
  xhr(xopts, function (err, res, body) {
    if (err) return cb(err)
    else if (res.statusCode === 304) { // not modified
      cb(null, null, res.headers)
    } else {
      var nextra = {}
      if (res.headers.etag) nextra.etag = res.headers.etag
      if (res.headers['last-modified']) {
        nextra.lastModified = res.headers['last-modified']
      }
      cb(null, body, nextra)
    }
  })
}
