var hyperquest = require('hyperquest')
var concat = require('concat-stream')
var mkdirp = require('mkdirp')
var hver = require('html-version')
var url = require('url')
var has = require('has')
var once = require('once')
var createHash = require('sha.js')
var EventEmitter = require('events').EventEmitter

module.exports = function (href, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  cb = once(cb || noop)
  var hproto = url.parse(href)
  var seen = opts.seen || {}
  var seenv = opts.seenVersions || {}
  var loader = opts.load || load
  var vers = {}
  var pending = 0
  var ev = new EventEmitter
  request(href)
  return ev

  function request (href) {
    if (has(seen, href)) return
    seen[href] = true
    pending++
    loader(href, function (err, body) {
      if (err) return cb(err)
      var html = hver.parse(body)
      html.hash = createHash('sha512').update(body).digest()
      if (has(seenv, html.version)) return done()
      ev.emit('version', html, body)
      vers[html.version] = html
      seenv[html.version] = true
      Object.keys(html.versions).forEach(function (v) {
        html.versions[v].forEach(function (hv) {
          if (has(seenv, v)) return
          var p = url.resolve(href, hv)
          var u = url.parse(p)
          if (/^https?:/.test(u.protocol)) request(p)
        })
        ;(html.predecessor || []).forEach(function (p) {
          var pr = url.resolve(href, p)
          var u = url.parse(pr)
          if (/^https?:/.test(u.protocol)) request(pr)
        })
      })
      done()
      function done () {
        if (--pending === 0) cb(null, vers)
      }
    })
  }
}

function noop () {}

function load (href, cb) {
  var r = hyperquest(href)
  r.once('error', cb)
  r.pipe(concat(function (body) { cb(null, body) }))
}
