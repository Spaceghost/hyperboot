var url = require('url');
var fs = require('fs');
var path = require('path');
var defined = require('defined');
var routes = require('routes');
var rprefix = require('route-prefix');

module.exports = Boot;

function Boot (opts) {
    if (!(this instanceof Boot)) return new Boot(opts);
    if (!opts) opts = {};
    this.prefix = path.resolve('/', defined(opts.prefix, '/'));
    this.router = this._createRoutes(); //rprefix(this.prefix, this._createRoutes());
    this.maxage = defined(
        opts.maxage,
        Math.floor(60 * 60 * 24 * 365.25 * 100) // ~100 years
    );
    this.dir = opts.dir;
}

Boot.prototype.exec = function (req, res) {
    var m = this.router.match(req.url);
    if (!m) return null;
    m.fn(req, res, m);
    return true;
};

Boot.prototype._createRoutes = function () {
    var self = this;
    var r = routes();
    serveFile('/', 'index.html', 'text/html; charset=UTF-8');
    serveFile('hyperboot.js', 'text/javascript; charset=UTF-8');
    serveFile('hyperboot.png', 'image/png');
    serveFile('hyperboot.css', 'text/css; charset=UTF-8');
    
    r.addRoute('/hyperboot.appcache', function (req, res, params) {
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        res.setHeader('content-type', 'text/cache-manifest; charset=UTF-8');
        
        res.end('CACHE MANIFEST\n'
            + path.join(self.prefix) + '\n'
            + path.join(self.prefix, 'hyperboot.appcache') + '\n'
            + path.join(self.prefix, 'hyperboot.js') + '\n'
            + path.join(self.prefix, 'hyperboot.png') + '\n'
            + path.join(self.prefix, 'hyperboot.css') + '\n'
            + 'NETWORK:\n'
            + 'versions.json\n'
        );
    });
    r.addRoute('/versions.json', function (req, res, params) {
        res.setHeader('content-type', 'application/json');
        var r = fs.createReadStream(path.join(self.dir, 'versions.json'));
        r.on('error', function (err) { res.end('') });
        r.pipe(res);
    });
    return r;
    
    function serveFile (p, file, type) {
        if (type === undefined) {
            type = file;
            file = p;
            p = '/' + p;
        }
        r.addRoute(p, function (req, res, params) {
            res.setHeader('content-type', type);
            res.setHeader('cache-control', 'max-age=' + self.maxage);
            readFile(file).pipe(res);
        });
    }
};

function readFile (file) {
    var fpath = path.join(__dirname, 'static', file);
    return fs.createReadStream(fpath);
}
