var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/static');
var bootver = require('../')();

var server = http.createServer(function (req, res) {
    console.error(req.method, req.url);
    
    if (bootver.exec(req, res)) return;
    else stdir(req, res);
});
server.listen(0, function () {
    console.error('http://localhost:' + server.address().port);
});
