var fs = require('fs')
var path = require('path')
var url = require('url')

module.exports = function (href, opts, cb) {
  var p = url.parse(href).pathname
  var file = path.basename(p)
  fs.readFile(path.join('.hyperboot', file), cb)
}
