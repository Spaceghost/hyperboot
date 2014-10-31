var http = require('http');
var ecstatic = require('ecstatic');
var url = require('url');
var fs = require('fs');
var stdir = ecstatic(__dirname + '/static');

var server = http.createServer(function (req, res) {
    console.error(req.method, req.url);
    
    var u = url.parse(req.url);
    if (u.pathname === '/site.appcache') {
        var age = 60 * 60 * 24 * 365.25 * 100; // ~100 years
        res.setHeader('cache-control', 'max-age=' + age);
        res.setHeader('content-type', 'text/cache-manifest; charset=UTF-8');
        var file = __dirname + '/static/site.appcache';
        fs.createReadStream(file).pipe(res);
    }
    else  {
        stdir(req, res);
    }
});
server.listen(0, function () {
    console.error('http://localhost:' + server.address().port);
});
