var url = require('url');
var fs = require('fs');
var path = require('path');
var defined = require('defined');
var routes = require('routes');
var rprefix = require('route-prefix');
var hyperstream = require('hyperstream');

module.exports = Boot;

function Boot (opts) {
    if (!(this instanceof Boot)) return new Boot(opts);
    if (!opts) opts = {};
    this.prefix = path.resolve('/', defined(opts.prefix, '/'));
    this.router = this._createRoutes(); //rprefix(this.prefix, this._createRoutes());
    
    if (opts.dev) this.dev = true;
    this.maxage = defined(
        opts.maxage,
        this.dev ? 0 : Math.floor(60 * 60 * 24 * 365.25 * 100) // ~100 years
    );
    this.dir = opts.dir;
    this.vars = { name: defined(opts.name, 'APPLICATION') };
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
    r.addRoute('/', function (req, res, params) {
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        res.setHeader('content-type', 'text/html; charset=UTF-8');
        
        var props = { '*[data-name]': self.vars.name };
        if (self.dev) props['html:first'] = { manifest: undefined };
        readFile('index.html').pipe(hyperstream(props)).pipe(res);
    });
    
    serveFile('hyperboot.js', 'text/javascript; charset=UTF-8');
    serveFile('hyperboot.png', 'image/png');
    serveFile('hyperboot.css', 'text/css; charset=UTF-8');
    serveFile('fonts/start.ttf', 'font/ttf');
    
    r.addRoute('/hyperboot.appcache', function (req, res, params) {
        res.setHeader('cache-control', 'max-age=' + self.maxage);
        res.setHeader('content-type', 'text/cache-manifest; charset=UTF-8');
        
        res.end('CACHE MANIFEST\n'
            + path.join(self.prefix) + '\n'
            + path.join(self.prefix, 'hyperboot.appcache') + '\n'
            + path.join(self.prefix, 'hyperboot.js') + '\n'
            + path.join(self.prefix, 'hyperboot.png') + '\n'
            + path.join(self.prefix, 'hyperboot.css') + '\n'
            + path.join(self.prefix, 'fonts/start.ttf') + '\n'
            + 'NETWORK:\n'
            + 'versions.json\n'
        );
    });
    r.addRoute('/versions.json', function (req, res, params) {
        res.setHeader('content-type', 'application/json');
        var r = fs.createReadStream(path.join(self.dir, 'versions.json'));
        r.on('error', function (err) { res.end('[]') });
        r.pipe(res);
    });
    return r;
    
    function serveFile (file, type) {
        r.addRoute('/' + file, function (req, res, params) {
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
