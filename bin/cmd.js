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
  var src, pending = 2;
  fs.readFile(argv._[1], function (err, src_) {
    if (err) return exit(err)
    src = src_
    ready()
  })
  mkdirp('.hyperboot', function (err) {
    if (err) return exit(err)
    else ready()
  })
  function ready () {
    if (--pending !== 0) return
    var loc = []
    fs.readFile('.hyperboot/latest.html', function (err, prev) {
      var newsrc
      if (err && err.code === 'ENOENT') {
        newsrc = hver.update(src, [], hver.meta(src))
      }
      else if (err) return exit(err)
      else {
        info = hver.parse(prev)
        var prevhash = createHash('sha512').update(prev).digest('hex')
        loc.push(prevhash + '.html')
        newsrc = hver.update(src, loc, info)
      }
      var pending = 2;
      var hash = createHash('sha512').update(newsrc).digest('hex')
      fs.writeFile('.hyperboot/latest.html', newsrc, done)
      fs.writeFile('.hyperboot/' + hash, newsrc, done)
      function done () {
        if (--pending !== 0) return
        console.log(info.version, hash.slice(0,32))
      }
    })
  }
} else if (argv._[0] === 'clone') {
  console.log('TODO')
}

function exit (err) {
  console.error(err.message || String(err))
  process.exit(1)
}
