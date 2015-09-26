var hyperquest = require('hyperquest')
var concat = require('concat-stream')
var mkdirp = require('mkdirp')
var hver = require('html-version')

module.exports = function (href, opts, cb) {
  if (!opts) opts = {}
  if (!opts.dir) opts.dir = '.hyperboot'
  mkdirp(opts.dir, function (err) {
    var r = hyperquest(href)
    r.pipe(concat(function (body) {
      var vers = hver.parse(body)
      console.log(vers)
    }))
  })
}
