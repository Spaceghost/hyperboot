var webtorrent = require('webtorrent')
var swarmlog = require('swarmlog')
var join = require('hyperlog-join')
var xtend = require('xtend')
var sub = require('subleveldown')
var through = require('through2')
var writeonly = require('write-only-stream')
var randombytes = require('randombytes')

var LOGDB = 'l', VERDB = 'v', FILES = 'f'

module.exports = Hyperboot

function Hyperboot (opts) {
  if (!(this instanceof Hyperboot)) return new Hyperboot(opts)
  var self = this
  self.log = swarmlog(xtend(opts, {
    db: sub(opts.db, LOGDB),
    valueEncoding: 'json'
  }))
  self.client = webtorrent({
    wrtc: opts.wrtc
  })
  self.store = opts.store

  self.versions = join({
    log: self.log,
    db: sub(opts.db, VERDB),
    map: function (row) {
      if (row.value.type === 'version') {
        return { key: row.value.version, value: 0 }
      }
    }
  })
}

Hyperboot.prototype.publish = function (version, opts, cb) {
  var self = this
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  if (!cb) cb = noop

  var key = randombytes(32).toString('hex')
  var xopts = xtend(opts, {
    name: opts.name || 'index.html'
    /*
    store: function (size, opts) {
      return self.store(size, { name: key })
    }
    */
  })

  var stream = through()
  self.client.seed([stream], xopts, function (torrent) {
    var doc = {
      version: version,
      magnetURI: torrent.magnetURI
    }
    self.log.append(doc, function () {
      cb(null, torrent.magnetURI)
    })
  })
  return writeonly(stream)
}

function noop () {}
