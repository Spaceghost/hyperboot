#!/usr/bin/env node
var RPC = require('swarmbot/rpc')
var swarmlog = require('swarmlog')
var fs = require('fs')
var path = require('path')
var xdg = require('xdg-basedir')
var level = require('level')
var mkdirp = require('mkdirp')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

if (argv._[0] === 'publish') {
  var rpc = RPC()
  var cwd = process.cwd()
  var files = argv._.slice(1).map(function (file) {
    return path.resolve(file)
  })
  rpc.emitEvent('seed-files', files)
  rpc.mirroring(function (err, mirrors) {
    console.log(mirrors)
  })
} else if (argv._[0] === 'versions') {
} else if (argv._[0] === 'seeding') {
  var rpc = RPC()
  rpc.emitEvent('seed-list', function (err, magnets) {
    ;(magnets || []).forEach(function (magnet) {
      console.log(magnet)
    })
  })
}

function getlog (cb) {
  getdir(process.cwd(), function (err, dir) {
    fs.readFile(path.join(dir, 'hyperboot.json'), function (err, src) {
    })
  })
}

function dbdir (id, cb) {
  var dir = path.join(xdg.config, 'hyperboot', id + '.db')
  mkdirp(dir, function (err) {
    if (err) cb(err)
    else cb(null, dir)
  })
}

function getdir (dir, cb) {
  fs.stat(path.join(dir, 'hyperboot.json'), function (err, stat) {
    var ndir = path.dirname(dir)
    if (ndir === dir) cb(null, undefined)
    else getdir(ndir, cb)
  })
}
