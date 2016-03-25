var sub = require('subleveldown')
var webtorrent = require('webtorrent')
var hindex = require('hyperlog-index')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hseed = require('hyperlog-seed')
var wseed = require('hyperlog-webtorrent-seed')
var through = require('through2')
var pump = require('pump')

var HSEED = 'h', WSEED = 'w', INFO = 'i'

module.exports = Hyperboot
inherits(Hyperboot, EventEmitter)

function Hyperboot (opts) {
  var self = this
  if (!(self instanceof Hyperboot)) return new Hyperboot(opts)
  EventEmitter.call(self)
  if (!opts) opts = {}
  self.appfeed = opts.appfeed
  self.cmdlog = opts.cmdlog
  self.store = opts.store
  self._seeding = {}
  self.infodb = sub(opts.db, INFO, { valueEncoding: 'json' })
  self.client = webtorrent()

  self.client.on('torrent', function (torrent) {
    var doc = {
      progress: torrent.progress,
      size: 0
    }
    torrent.files.forEach(function (file) {
      doc.size += file.length
    })
    self.infodb.put(torrent.infoHash, doc, onput)
    torrent.on('download', function () {
      doc.progress = torrent.progress
      self.infodb.put(torrent.infoHash, doc, onput)
    })
    self.emit('torrent', torrent)

    function onput (err) { if (err) self.emit('error', err) }
  })

  self.seeder = hseed({
    db: sub(opts.db, HSEED),
    log: self.cmdlog,
    map: function (row) {
      if (row.link) return { type: 'put', link: row.link }
      if (row.unlink) return { type: 'del', link: row.unlink }
    }
  })
  var w = wseed({
    db: sub(opts.db, WSEED),
    store: self.store,
    seeder: self.seeder,
    client: self.client
  })
  w.on('error', self.emit.bind(self, 'error'))
}

Hyperboot.prototype.seed = function (key, cb) {
  var self = this
  self.appfeed.get(key, function (err, doc) {
    if (err) return cb(err)
    var link = doc.value.link
    if (self._seeding[key]) return cb(null)
    self._seeding[key] = true
    if (self.client.get(link)) return cb(null)
    self.cmdlog.append({ link: link }, cb)
  })
}

Hyperboot.prototype.unseed = function (key, cb) {
  var self = this
  self.appfeed.get(key, function (err, doc) {
    if (err) return cb(err)
    var link = doc.value.link
    self.cmdlog.append({ unlink: link }, cb)
  })
}

Hyperboot.prototype.download = function (key, cb) {
  var self = this
  self.appfeed.get(key, function (err, doc) {
    if (err) return cb(err)
    self.client.add(doc.value.link, function (torrent) {
      torrent.once('done', function () {
        self.client.remove(doc.value.link, cb)
      })
    })
  })
}

Hyperboot.prototype.stop = function (key, cb) {
  var self = this
  self.appfeed.get(key, function (err, doc) {
    if (err) cb(err)
    else self.client.remove(doc.value.link)
  })
}

Hyperboot.prototype.versions = function (opts) {
  var self = this
  return pump(self.appfeed.createReadStream(opts), through.obj(write))
  function write (row, enc, next) {
    self.infodb.get(row.key, function (err, doc) {
      var result = {
        key: row.key,
        version: row.value.version,
        link: row.value.link,
        time: row.value.time,
        files: row.value.files,
        seeding: Boolean(self.client.get(row.value.link))
      }
      if (doc) {
        result.size = doc.size
        result.progress = doc.progress
      }
      next(null, result)
    })
  }
}
