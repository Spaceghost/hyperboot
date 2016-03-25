#!/usr/bin/env node
var RPC = require('swarmbot/rpc')
var fs = require('fs')
var path = require('path')
var xdg = require('xdg-basedir')
var level = require('level')
var mkdirp = require('mkdirp')
var ssbkeys = require('ssb-keys')
var sodium = require('chloride')
var hyperlog = require('hyperlog')
var hsodium = require('hyperlog-sodium')
var normkey = require('swarmlog/normkey.js')
var defined = require('defined')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

if (argv._[0] === 'id') {
  getdir(process.cwd(), function (err, dir) {
    if (err) return error(err)
    var pkg = require(path.join(dir, 'hyperboot.json'))
    console.log(pkg.id)
  })
} else if (argv._[0] === 'init') {
  var rpc = RPC()
  var hfile = path.join(process.cwd(), 'hyperboot.json')
  rpc.readConfig(function (err, config) {
    if (!config) config = {}
    var plugins = config.plugins || []
    if (plugins.indexOf('swarmbot-webtorrent') < 0) {
      error('swarmbot-webtorrent plugin not registered. Do:\n\n'
        + '  swarmbot plugins install swarmbot-webtorrent\n'
        + '  swarmbot restart\n')
    } else fs.stat(hfile, onstat)
  })
  function onstat (err, stat) {
    if (!stat) {
      createKeys(function (err, keys) {
        if (err) return error(err)
        var src = strj({ id: keys.public })
        fs.writeFile(hfile, src, function (err) {
          if (err) return error(err)
          console.error('created file: ' + hfile)
          console.error('app key: ' + keys.public)
          getlog(onlog)
        })
      })
    } else getlog(onlog)
  }
  function onlog (err, id, log) {
    if (err) return error(err)
    rpc.mirroring(function (err, mirrors) {
      if (err) return error(err)
      if (!mirrors) mirrors = []
      if (mirrors.indexOf(id) < 0) {
        rpc.mirror(id, function (err) {
          if (err) error(err)
          else process.exit(0)
        })
      }
    })
  }
} else if (argv._[0] === 'publish') {
  var rpc = RPC()
  var cwd = process.cwd()
  var files = argv._.slice(1).map(function (file) {
    return path.resolve(file)
  })
  var pending = 2, torrent, id, log
  getlog(function (err, i, l) {
    if (err) return error(err)
    id = i, log = l
    done()
  })
  rpc.emitEvent('seed-files', files, function (t) {
    console.log(t.magnetURI)
    torrent = t
    done()
  })
  function done () {
    if (--pending !== 0) return
    log.append({
      time: new Date().toISOString(),
      version: argv.version,
      link: torrent.magnetURI,
      files: torrent.files
    }, onappend)

    function onappend () {
      var r = rpc.replicateStream(id)
      var l = log.replicate()
      l.on('end', function () {
        process.exit(0)
      })
      r.pipe(l).pipe(r)
    }
  }
} else if (argv._[0] === 'versions') {
  getlog(function (err, id, log) {
    if (err) return error(err)
    log.createReadStream().on('data', function (row) {
      if (row.value && /^magnet:/.test(row.value.link)) {
        console.log(row.value.link)
      }
    })
  })
} else if (argv._[0] === 'seeding') {
  var rpc = RPC()
  rpc.emitEvent('seed-list', function (err, magnets) {
    ;(magnets || []).forEach(function (magnet) {
      console.log(magnet)
    })
    process.exit(0)
  })
}

function getlog (cb) {
  getdir(process.cwd(), function (err, dir) {
    if (!dir) return cb(new Error(
      'project not initialized, run `hyperboot init`'))

    fs.readFile(path.join(dir, 'hyperboot.json'), 'utf8', function (err, src) {
      if (err) return cb(err)
      try { var pkg = JSON.parse(src) }
      catch (err) { return cb(err) }
      dbdir(pkg.id, function (err, dbdir) {
        if (err) return cb(err)
        else createLog(pkg.id, dbdir, cb)
      })
    })
  })
}

function createLog (id, dbdir, cb) {
  var dir = path.dirname(dbdir)
  var keyfile = path.join(dir, Buffer(id, 'base64').toString('hex') + '.keys')
  fs.readFile(keyfile, 'utf8', function (err, src) {
    if (src) {
      try { var keys = JSON.parse(src) }
      catch (err) {}
    }
    if (!keys) {
      keys = ssbkeys.generate()
      fs.writeFile(keyfile, strj(keys), function (err) {
        if (err) cb(err)
        else ready(keys)
      })
    } else ready(keys)
  })

  function ready (keys) {
    var log = hlog({
      db: level(dbdir),
      keys: keys,
      sodium: sodium,
      valueEncoding: 'json'
    })
    cb(null, id, log)
  }
}

function dbdir (id, cb) {
  var dir = path.join(xdg.config, 'hyperboot', 'app', id + '.log')
  mkdirp(dir, function (err) {
    if (err) cb(err)
    else cb(null, dir)
  })
}

function getdir (dir, cb) {
  fs.stat(path.join(dir, 'hyperboot.json'), function (err, stat) {
    if (stat) return cb(null, dir)
    var ndir = path.dirname(dir)
    if (ndir === dir) cb(null, undefined)
    else getdir(ndir, cb)
  })
}

function createKeys (cb) {
  var keys = ssbkeys.generate()
  var id = keys.public
  var dir = path.join(xdg.config, 'hyperboot', 'app')
  mkdirp(dir, function (err) {
    if (err) return cb(err)
    var keyfile = path.join(dir, Buffer(id, 'base64').toString('hex') + '.keys')
    fs.writeFile(keyfile, strj(keys), function (err) {
      if (err) cb(err)
      else cb(null, keys)
    })
  })
}

function error (err) {
  console.error(err.message || err)
  process.exit(1)
}

function strj (obj) {
  return JSON.stringify(obj, null, 2) + '\n'
}

function hlog (opts) {
  if (!opts) opts = {}
  var keys = opts.keys || {}
  var kopts = {
    publicKey: normkey(defined(
      opts.publicKey, opts.public, opts.pub, opts.identity, opts.id,
      keys.publicKey, keys.public, keys.pub, keys.identity, keys.id
    )),
    secretKey: normkey(defined(
      opts.secretKey, opts.secret, opts.private, opts.priv,
      keys.secretKey, keys.secret, keys.private, keys.priv
    ))
  }
  return hyperlog(opts.db, hsodium(opts.sodium, kopts, opts))
}
