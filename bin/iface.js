var EventEmitter = require('events').EventEmitter
var minimist = require('minimist')
var hyperboot = require('hyperboot')
var sodium = require('chloride')
var collect = require('collect-stream')
var fs = require('fs')
var path = require('path')

var iface = null
module.exports = function (server, stream, args) {
  if (!iface) iface = new Iface(server, stream, args)
  return iface
}

module.exports.prototype = Iface.prototype
inherits(Iface, EventEmitter)

function Iface (server, stream, args) {
  if (!(this instanceof Iface)) return new Iface(server, stream, args)
  EventEmitter.call(this)
  var argv = minimist(args)
  var keys = require(argv.keys)
  this.hyperboot = hyperboot({
    db: db,
    sodium: sodium,
    keys: keys,
    hubs: argv.hub
  })
}

Iface.prototype.id = function (cb) {
  cb(null, keys.public)
}

Iface.prototype.publish = function (files, opts, cb) {
  this.hyperboot.publish(files, opts, cb)
}

Iface.prototype.versions = function (cb) {
  collect(this.versions.relations, function (err, vers) {
    cb(err, vers)
  })
}
