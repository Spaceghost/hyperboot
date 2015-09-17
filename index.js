var xhr = require('xhr')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hver = require('html-version')

module.exports = Hyperboot
inherits(Hyperboot, EventEmitter)

function Hyperboot () {
  if (!(this instanceof Hyperboot)) return new Hyperboot
}

Hyperboot.prototype.load = function (url, cb) {
  xhr(url, function (err, res, body) {
    if (err) return cb(err)
    console.log('body=', body)
    var info = hver.parse(body)
    console.log('info=', info)
  })
}

Hyperboot.prototype.versions = function (cb) {
  // ...
}
