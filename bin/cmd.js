#!/usr/bin/env node
var mkdirp = require('mkdirp')
var fs = require('fs')
var path = require('path')
var has = require('has')
var createHash = require('sha.js')
var hver = require('html-version')
var semver = require('semver')
var url = require('url')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { h: 'help' },
  boolean: [ 'help' ]
})
var clone = require('../clone.js')

if (argv.help || argv._[0] === 'help') {
  usage(0)
} else if (argv._[0] === 'init') {
  fs.createReadStream(path.join(__dirname, 'init.html'))
    .pipe(process.stdout)
} else if (argv._[0] === 'commit') {
  var refs = {}, pending = 3
  var file = argv._[1]

  mkdirp('.hyperboot', function (err) {
    if (err) return exit(err)
    fs.readFile(file, function (err, src) {
      if (err) return exit(err)
      refs.source = src
      ready()
    })
    fs.readFile('.hyperboot/index.html', function (err, src) {
      if (err && err.code !== 'ENOENT') return exit(err)
      refs.prevSource = src
      if (!err) {
        refs.prevHash = createHash('sha512').update(src).digest('hex')
      }
      ready()
    })
    fs.readlink('.hyperboot/index.html', function (err, link) {
      if (err && err.code !== 'ENOENT') return exit(err)
      refs.prevFile = link
      ready()
    })
  })

  function ready (err) {
    if (err) return exit(err)
    if (--pending !== 0) return
    var newsrc, prevInfo, loc = [ refs.prevFile ]
    var info = hver.parse(refs.source)
    if (refs.prevSource) {
      prevInfo = hver.parse(refs.prevSource)
      if (has(prevInfo.versions, info.version)) {
        return exit('cannot overwrite existing version')
      }
      newsrc = hver.update(refs.source, loc, prevInfo)
      var phash = createHash('sha512').update(refs.prevSource).digest('hex')
      loc.push(phash + '.html')
    } else {
      newsrc = hver.update(refs.source, [], info)
    }

    var xpending = 2
    var hash = createHash('sha512').update(newsrc).digest('hex')
    var file = path.join('.hyperboot', hash + '.html')
    fs.unlink('.hyperboot/index.html', function (err) {
      if (err && err.code !== 'ENOENT') return exit(err)
      else makeLink()
    })
    fs.writeFile(file, newsrc, makeLink)

    function makeLink (err) {
      if (err) return exit(err)
      if (--xpending !== 0) return
      fs.symlink(path.basename(file), '.hyperboot/index.html', function (err) {
        if (err) return exit(err)
        console.log(info.version, hash.slice(0,32))
      })
    }
  }
} else if (argv._[0] === 'clone' && argv._.length >= 2) {
  var href = argv._.slice(1).join(' ')
  var pending = 1, file = null
  var seen = {}, seenv = {}
  mkdirp('.hyperboot', function (err) {
    if (err) return exit(err)
    var pend = 2
    fs.readdir('.hyperboot', function (err, files) {
      if (err) return exit(err)
      files.forEach(function (file) {
        if (file === 'index.html') return
        seen[url.resolve(href, file)] = true
      })
      done()
    })
    fs.readFile('.hyperboot/index.html', function (err, src) {
      if (src) {
        var html = hver.parse(src)
        seenv[html.version] = true
        Object.keys(html.versions).forEach(function (v) {
          seenv[v] = true
        })
      }
      done()
    })
    function done () {
      if (--pend !== 0) return
      var c = clone(href, { seen: seen, seenVersions: seenv }, onclone)
      c.on('version', onversion)
    }
  })
  function onclone (err, vers) {
    if (err) return exit(err)
    var sorted = Object.keys(vers).sort(semver.compare)
    sorted.forEach(function (v) {
      console.log(v, vers[v].hash.slice(0,32).toString('hex'))
    })
    if (sorted.length) {
      var latest = vers[sorted[sorted.length-1]]
      file = path.join('.hyperboot', latest.hash.toString('hex') + '.html')
    }
    done()
  }
  function onversion (html, body) {
    pending ++
    var file = '.hyperboot/' + html.hash.toString('hex') + '.html'
    fs.stat(file, function (err, stat) {
      if (!stat) fs.writeFile(file, body, onwrite)
      else done()
    })
    function onwrite (err) {
      if (err) exit(err)
      else done()
    }
  }
  function done () {
    if (--pending !== 0) return
    if (!file) return
    fs.unlink('.hyperboot/index.html', function () {
      fs.symlink(path.basename(file), '.hyperboot/index.html', function (err) {
        if (err) return exit(err)
      })
    })
  }
} else if (argv._[0] === 'versions') {
  clone(
    'http://localhost:9999/index.html',
    { load: loader },
    function (err, vers) {
      if (err) return exit(err)
      console.log(vers)
    }
  )
} else usage(1)

function exit (err) {
  console.error(err.message || String(err))
  process.exit(1)
}

function usage (code) {
  var r = fs.createReadStream(path.join(__dirname, 'usage.txt'))
  r.pipe(process.stdout)
  if (code) r.on('end', function () { process.exit(code) })
}

function loader (href, cb) {
  var p = url.parse(href).pathname
  var file = path.basename(p)
  fs.readFile(path.join('.hyperboot', file), cb)
}
