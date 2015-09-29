var concat = require('concat-stream')
var hyperquest = require('hyperquest')
var once = require('once')

module.exports = function (href, cb) {
  cb = once(cb || noop)
  var r = hyperquest(href)
  r.once('error', cb)
  r.pipe(concat(function (body) { cb(null, body) }))
}

function noop () {}
