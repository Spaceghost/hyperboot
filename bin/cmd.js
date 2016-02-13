#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var fdstore = require('fd-chunk-store')
var mkdirp = require('mkdirp')
var level = require('level')
var ssbkeys = require('ssb-keys')
var homedir = require('homedir')
var wrtc = require('wrtc')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

var dir = path.join(homedir(), '.config/boot')
mkdirp.sync(path.join(dir, 'store'))
mkdirp.sync(path.join(dir, 'db'))

var hyperboot = require('../')
withKeys(function (err, keys) {
  if (err) return error(err)
  var boot = hyperboot({
    db: level(path.join(process.cwd(), '.boot/db')),
    sodium: require('chloride'),
    store: function (size, opts) {
      return fdstore(size, { path: path.join('.boot/store', opts.name) })
    },
    wrtc: wrtc,
    keys: keys,
    hubs: [ 'https://signalhub.publicbits.org/' ]
  })
  if (argv._[0] === 'publish') {
    process.stdin.pipe(boot.publish(argv._[1], function (err, uri) {
      console.log(uri)
    }))
  } else if (argv._[0] === 'id') {
    console.log(keys.public)
    process.exit(0)
  }
})

function withKeys (cb) {
  var file = path.join(dir, 'keys.json')
  fs.exists(file, function (ex) {
    if (ex) return fs.readFile(file, 'utf8', onread)
    var keys = ssbkeys.generate()
    fs.writeFile(file, JSON.stringify(keys, null, 2), function (err) {
      if (err) cb(err)
      else cb(null, keys)
    })
  })
  function onread (err, src) {
    if (err) return cb(err)
    try { var keys = JSON.parse(src) }
    catch (err) { return cb(err) }
    cb(null, keys)
  }
}

function error (err) {
  console.error((err.message || err) + '\n')
  process.exit(1)
}
