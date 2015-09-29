var xhr = require('xhr')
var url = require('url')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var hver = require('html-version')
var semver = require('semver')
var packer = require('./lib/pack.js')
var defaults = require('levelup-defaults')
var walk = require('./lib/walk.js')
var through = require('through2')
var xtend = require('xtend')

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
  this.versions(function (err, versions) {
    versions.forEach(seen)
    self._ready = true
    self.emit('ready')
  })
  self.on('version', seen)
  self.on('remove', function (v) {
    self._seenv[v] = false
    self._seenmap[v].forEach(function (href) {
      self._seen[href] = false
    })
    self._seenmap[v] = null
  })
  function seen (v) {
    self._seenmap[v.version] = []
    v.hrefs.forEach(function (href) {
      self._seen[href] = true
      self._seenmap[v.version].push(href)
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

Hyperboot.prototype.load = ready(function (href, cb) {
  var self = this
  var pending = 1, vers
  var w = walk(href, {
    seen: self._seen,
    seenVersions: self._seenv,
    load: loader
  }, onwalk)
  w.on('version', function (v) {
    pending++
    self.emit('version', v)
    self.db.put('version!' + packer.pack(v.version), v, function (err) {
      if (err) cb(err)
      else done()
    })
  })
  return w
  function done () { if (--pending === 0) cb(null, vers) }
  function onwalk (err, vers_) {
    if (err) cb(err)
    vers = vers_
    done()
  }
})

Hyperboot.prototype.versions = function (cb) {
  var versions = cb ? [] : null
  return this.db.createReadStream('version!').pipe(through.obj(write, end))
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
          self._seen[href] = false
        })
        self._seenv[v.version] = false
        self.emit('remove', v.version)
      })
    }
  })
}

function loader (href, cb) {
  xhr(href, function (err, res, body) {
    if (err) return cb(err)
    else cb(null, body)
  })
}

function noop () {}
