var url = require('url')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hver = require('html-version')
var semver = require('semver')
var packer = require('./lib/pack.js')
var defaults = require('levelup-defaults')
var walk = require('./lib/walk.js')
var through = require('through2')
var copy = require('shallow-copy')
var defined = require('defined')
var once = require('once')

var loader = require('./lib/load/http.js')

module.exports = Hyperboot
inherits(Hyperboot, EventEmitter)

function Hyperboot (db, opts) {
  if (!(this instanceof Hyperboot)) return new Hyperboot(db, opts)
  var self = this
  if (!opts) opts = {}
  this.db = defaults(db, { valueEncoding: 'json' })
  this._ready = false
  this._seen = {}
  this._seenv = {}
  this._seenmap = {}
  this._extra = {}
  this.versions(function (err, versions) {
    versions.forEach(function (v) { seen(v) })
    self._ready = true
    self.emit('ready')
  })
  self.on('version', function (v) { seen(v, true) })
  self.on('remove', function (v) {
    delete self._seenv[v]
    self._seenmap[v].forEach(function (href) {
      delete self._seen[href]
    })
    delete self._seenmap[v]
  })
  function seen (v, hrefs) {
    self._seenmap[v.version] = []
    v.hrefs.forEach(function (href) {
      if (hrefs) self._seen[href] = true
      self._seenmap[v.version].push(href)
      self._extra[href] = v.extra
    })
    self._seenv[v.version] = true
  }
}

function ready (fn) {
  return function () {
    var self = this
    var args = arguments
    if (self._ready) return fn.apply(self, args)
    self.once('ready', function () { fn.apply(self, args) })
  }
}

Hyperboot.prototype.load = ready(function (href, opts, cb) {
  var self = this
  if (!opts) opts = {}
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  cb = once(cb || noop)

  var pending = 1, vers
  var seen = copy(self._seen)
  delete seen[href]

  var w = walk(href, {
    seen: seen,
    seenVersions: self._seenv,
    extra: self._extra,
    load: defined(opts.load, loader)
  }, onwalk)
  w.on('version', function (v, body) {
    pending++
    var bodystr = body.toString('utf8')
    self.db.batch([
      { type: 'put', key: 'version!' + packer.pack(v.version), value: v },
      {
        type: 'put',
        key: 'html!' + v.hash,
        value: bodystr,
        valueEncoding: 'utf8'
      }
    ], onbatch)
    function onbatch (err) {
      if (err) return cb(err)
      self.emit('version', v, bodystr)
      done()
    }
  })
  return w
  function done () { if (--pending === 0) cb(null, vers) }
  function onwalk (err, vers_) {
    if (err) cb(err)
    vers = vers_
    done()
  }
})

Hyperboot.prototype.get = function (ver, cb) {
  var self = this
  if (ver === 'latest') {
    self.versions(function (err, vers) {
      if (err) return cb(err)
      if (!vers.length) return cb(new Error('no versions available'))
      ongetver(null, vers.sort(function (a, b) {
        return semver.compare(a.version, b.version)
      }).slice(-1)[0])
    })
  } else if (semver.valid(ver)) {
    self.db.get('version!' + packer.pack(ver), ongetver)
  } else {
    self.db.get('html!' + ver, { valueEncoding: 'utf8' }, cb)
  }
  function ongetver (err, v) {
    if (err) cb(err)
    else self.db.get('html!' + v.hash, { valueEncoding: 'utf8' }, cb)
  }
}

Hyperboot.prototype.versions = function (cb) {
  var versions = cb ? [] : null
  return this.db.createReadStream({ gt: 'version!', lt: 'version!~' })
    .pipe(through.obj(write, end))

  function write (row, enc, next) {
    if (versions) versions.push(row.value)
    this.push(row.value)
    next()
  }
  function end (next) {
    if (cb) cb(null, versions)
    next()
  }
}

Hyperboot.prototype.remove = function (ver, cb) {
  var self = this
  if (!cb) cb = noop
  self.db.batch([
    { type: 'del', key: 'version!' + packer.pack(ver) }
  ], onbatch)
  function onbatch (err) {
    if (err) return cb(err)
    self.emit('remove', ver)
  }
}

Hyperboot.prototype.clear = function (cb) {
  var self = this
  if (!cb) cb = noop
  self.versions(function (err, vers) {
    if (err) return cb(err)
    self.db.batch(vers.map(function (v) {
      return { type: 'del', key: 'version!' + packer.pack(v.version) }
    }), onbatch)
    function onbatch (err) {
      if (err) return cb(err)
      vers.forEach(function (v) {
        v.hrefs.forEach(function (href) {
          delete self._seen[href]
        })
        delete self._seenv[v.version]
        self.emit('remove', v.version)
      })
    }
  })
}

function noop () {}
