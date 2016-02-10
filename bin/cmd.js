#!/usr/bin/env node
var path = require('path')
var fdstore = require('fd-chunk-store')
var mkdirp = require('mkdirp')
var level = require('level')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

var dir = path.join(process.cwd(), '.boot')
mkdirp.sync(path.join(dir, 'store'))
mkdirp.sync(path.join(dir, 'db'))

var hyperboot = require('../')
var boot = hyperboot({
  db: level(path.join(process.cwd(), '.boot/db')),
  sodium: require('chloride'),
  store: function (size, opts) {
    return fdstore(size, { path: path.join('.boot/store', opts.name) })
  },
  wrtc: require('wrtc'),
  keys: require(path.join(process.cwd(), '.boot/keys')),
  hubs: [ 'https://signalhub.publicbits.org/' ]
})

if (argv._[0] === 'publish') {
  process.stdin.pipe(boot.publish(argv._[1], function (err, uri) {
    console.log(uri)
  }))
}
