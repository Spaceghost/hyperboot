var hver = require('html-version')
var url = require('url')
var has = require('has')
var once = require('once')
var createHash = require('sha.js')
var EventEmitter = require('events').EventEmitter
var copy = require('shallow-copy')

module.exports = function (href, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (!opts) opts = {}
  cb = once(cb || noop)
  var hproto = url.parse(href).protocol
  var seen = copy(opts.seen || {})
  var seenv = copy(opts.seenVersions || {})
  var loader = opts.load
  var ohref = href
  var vers = {}
  var pending = 0
  var ev = new EventEmitter
  var stopped = false
  ev.stop = function () { stopped = true }
  request(href)
  return ev

  function request (href) {
    if (stopped) return
    if (has(seen, href) && href !== ohref) return
    seen[href] = true
    pending++
    loader(href, function (err, body) {
      if (stopped) return
      if (err) return cb(err)
      var html = hver.parse(body)
      html.hash = createHash('sha512').update(body).digest()
      html.hrefs = [href]
      if (has(seenv, html.version) && href !== ohref) return done()
      if (!has(seenv, html.version)) ev.emit('version', html, body)
      vers[html.version] = html
      seenv[html.version] = true
      Object.keys(html.versions).forEach(function (v) {
        html.versions[v].forEach(function (hv) {
          if (has(seenv, v)) return
          var p = url.resolve(href, hv)
console.log('p=', p)
          var u = url.parse(p)
          if (u.protocol === hproto) request(p)
        })
      })
      ;(html.predecessor || []).forEach(function (p) {
        var pr = url.resolve(href, p)
console.log('PR=', pr, 'href=', href, 'p=', p) 
        var u = url.parse(pr)
        if (u.protocol === hproto) request(pr)
      })
      done()
      function done () {
        if (stopped) return
        if (--pending === 0) cb(null, vers)
      }
    })
  }
}

function noop () {}
