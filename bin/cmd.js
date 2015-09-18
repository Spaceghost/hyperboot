#!/usr/bin/env node
var mkdirp = require('mkdirp')
var fs = require('fs')
var path = require('path')
var createHash = require('sha.js')
var hver = require('html-version')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2))

if (argv._[0] === 'init') {
  fs.createReadStream(path.join(__dirname, 'init.html'))
    .pipe(process.stdout)
} else if (argv._[0] === 'release') {
  var refs = {}, pending = 3
  var file = argv._[1]

  mkdirp('.hyperboot', function (err) {
    if (err) return exit(err)
    fs.readFile(file, function (err, src) {
      if (err) return exit(err)
      refs.source = src
      ready()
    })
    fs.readFile('.hyperboot/latest.html', function (err, src) {
      if (err && err.code !== 'ENOENT') return exit(err)
      refs.prevSource = src
      if (!err) {
        refs.prevHash = createHash('sha512').update(src).digest('hex')
      }
      ready()
    })
    fs.readlink('.hyperboot/latest.html', function (err, link) {
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
      newsrc = hver.update(refs.source, loc, prevInfo)
      var phash = createHash('sha512').update(refs.prevSource).digest('hex')
      loc.push(phash + '.html')
    } else {
      newsrc = hver.update(refs.source, [], info)
    }

    var xpending = 2
    var hash = createHash('sha512').update(newsrc).digest('hex')
    var file = path.join('.hyperboot', hash + '.html')
    fs.unlink('.hyperboot/latest.html', function (err) {
      if (err && err.code !== 'ENOENT') return exit(err)
      else makeLink()
    })
    fs.writeFile(file, newsrc, makeLink)

    function makeLink (err) {
      if (err) return exit(err)
      if (--xpending !== 0) return
      fs.symlink(path.basename(file), '.hyperboot/latest.html', function (err) {
        if (err) return exit(err)
        console.log(info.version, hash.slice(0,32))
      })
    }
  }
} else if (argv._[0] === 'clone') {
  console.log('TODO')
}

function exit (err) {
  console.error(err.message || String(err))
  process.exit(1)
}
