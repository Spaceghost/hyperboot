var webtorrent = require('webtorrent')
var swarmlog = require('swarmlog')
var join = require('hyperlog-join')
var hseed = require('hyperlog-seed')
var wseed = require('hyperlog-webtorrent-seed')
var xtend = require('xtend')
var sub = require('subleveldown')
var randombytes = require('randombytes')
var ssbkeys = require('ssb-keys')

var LOGDB = 'l', VERDB = 'v', FILES = 'f', SEED = 's'

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
  self.versions = join({
    log: self.log,
    db: sub(opts.db, VERDB),
    map: function (row) {
      if (row.value.type === 'version') {
        return { key: row.value.version, value: 0 }
      }
    }
  })
  self.hseed = hseed({
    db: sub(opts.db, SEED),
    log: self.log,
    map: function (doc) {
      if (doc && doc.link) return { type: 'put', link: doc.link }
      if (doc && doc.unlink) return { type: 'del', link: doc.link }
    }
  })
  wseed({
    seeder: self.hseed,
    client: self.client,
    dir: opts.dir
  })
}

Hyperboot.prototype.init = function (dir, cb) {
}

Hyperboot.prototype.publish = function (files, opts, cb) {
  var self = this
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  if (!cb) cb = noop
  if (!opts.version) return error(cb, 'version required')

  self.client.seed(files, opts, function (torrent) {
    var doc = {
      version: opts.version,
      link: torrent.magnetURI
    }
    self.log.append(doc, function () {
      cb(null, torrent.magnetURI)
    })
  })
}

function noop () {}

function error (cb, msg) {
  var err = new Error(msg)
  process.nextTick(function () { cb(err) })
}
