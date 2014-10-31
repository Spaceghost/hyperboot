var http = require('http');
var ecstatic = require('ecstatic');
var url = require('url');
var fs = require('fs');
var stdir = ecstatic(__dirname + '/static');

var appver = require('../')();

var server = http.createServer(function (req, res) {
    console.error(req.method, req.url);
    
    if (appver.exec(req, res)) return;
    else stdir(req, res);
});
server.listen(0, function () {
    console.error('http://localhost:' + server.address().port);
});
