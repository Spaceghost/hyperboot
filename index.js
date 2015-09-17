var xhr = require('xhr')
var url = require('url')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hver = require('html-version')

module.exports = Hyperboot
inherits(Hyperboot, EventEmitter)

function Hyperboot () {
  if (!(this instanceof Hyperboot)) return new Hyperboot
}

Hyperboot.prototype.load = function (href, cb) {
  var self = this
  xhr(href, function (err, res, body) {
    if (err) return cb(err)
    var info = hver.parse(body)
    var versions = info.versions || {}

    Object.keys(versions).forEach(function (key) {
      self.emit('version', {
        version: key,
        integrity: info.integrity[key] || [],
        hrefs: versions[key]
      })
    })
  })
}

Hyperboot.prototype.versions = function (cb) {
  // ...
}
