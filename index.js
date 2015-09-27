var xhr = require('xhr')
var url = require('url')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hver = require('html-version')
var semver = require('semver')
var lex = require('lexicographic-integer')

module.exports = Hyperboot
inherits(Hyperboot, EventEmitter)

function Hyperboot (db) {
  if (!(this instanceof Hyperboot)) return new Hyperboot(db)
  this.db = db
  if (db) {
    this.on('version', function (v) {
      db.put('version!' + packv(v.version)
    })
  }
}

Hyperboot.prototype.load = function (href, cb) {
  var self = this
  xhr(href, function (err, res, body) {
    if (err) return cb(err)

    var info = hver.parse(body)
    var versions = info.versions || {}

    Object.keys(versions).sort(semver.compare).forEach(function (key) {
      self.emit('version', {
        version: key,
        integrity: info.integrity[key] || [],
        hrefs: (versions[key] || []).map(function (vhref) {
          return url.resolve(href, vhref)
        })
      })
    })

    self.emit('version', {
      version: info.version,
      integrity: info.integrity[res.responseURL] || [],
      hrefs: [res.responseURL]
    })
  })
}

Hyperboot.prototype.versions = function (cb) {
  // ...
}

function packv (ver) {
  var parts = ver.split('-')[0].split('.')
  return hexa(lex.pack(parts[0]))
    + '.' + hexa(lex.pack(parts[1]))
    + '.' + hexa(lex.pack(parts[2]))
    + ver.replace(/^\d+\.\d+\.\d+/, '')
}

function hexa (bytes) {
  var res = []
  for (var i = 0; i < bytes.length; i++) {
    var h = bytes[i].toString(16)
    if (h.length === 1) h = '0' + h
    res.push(h)
  }
  return res.join('')
}
