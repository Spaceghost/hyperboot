var url = require('url');
var fs = require('fs');
var path = require('path');
var defined = require('defined');
var routes = require('routes');
var rprefix = require('route-prefix');

module.exports = BootVer;

function BootVer (opts) {
    if (!(this instanceof BootVer)) return new BootVer(opts);
    if (!opts) opts = {};
    this.prefix = path.resolve('/', defined(opts.prefix, '/'));
    this.router = this._createRoutes(); //rprefix(this.prefix, this._createRoutes());
    this.maxage = defined(
        opts.maxage,
        Math.floor(60 * 60 * 24 * 365.25 * 100) // ~100 years
    );
}

BootVer.prototype.exec = function (req, res) {
    var m = this.router.match(req.url);
    if (!m) return null;
    m.fn(req, res, m);
    return true;
};

BootVer.prototype._createRoutes = function () {
    var self = this;
    var r = routes();
    r.addRoute('/', function (req, res, params) {
        res.setHeader('content-type', 'text/html; charset=UTF-8');
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        readFile('index.html').pipe(res);
    });
    r.addRoute('/appver.js', function (req, res, params) {
        res.setHeader('content-type', 'text/javascript; charset=UTF-8');
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        readFile('appver.js').pipe(res);
    });
    r.addRoute('/appver.appcache', function (req, res, params) {
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        res.setHeader('content-type', 'text/cache-manifest; charset=UTF-8');
        
        res.end('CACHE MANIFEST\n'
            + path.join(self.prefix) + '\n'
            + path.join(self.prefix, 'appver.appcache') + '\n'
            + path.join(self.prefix, 'appver.js') + '\n'
            + 'NETWORK:\n'
            + 'versions.json\n'
        );
    });
    r.addRoute('/versions.json', function (req, res, params) {
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        res.setHeader('content-type', 'application/json');
        res.write('{"0.0.0":"da39a3ee5e6b4b0d3255bfef95601890afd80709"}\n');
        res.end();
    });
    return r;
};

function readFile (file) {
    var fpath = path.join(__dirname, 'static', file);
    return fs.createReadStream(fpath);
}
