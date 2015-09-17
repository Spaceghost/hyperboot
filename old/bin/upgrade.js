var fs = require('fs');
var path = require('path');
var defined = require('defined');
var createHash = require('crypto').createHash;
var concat = require('concat-stream');
var through = require('through2');
var tmpdir = require('osenv').tmpdir;

var VERSION = require('../package.json').version;
var htmlfile = path.join(__dirname, '../static/index.html');

module.exports = function (dir, cb) {
    var tmpfile = path.join(
        tmpdir(), '.hyperboot-' + Date.now() + '-' + Math.random()
    );
    var jsonfile = path.join(dir, 'versions.json');
    var input = fs.createReadStream(htmlfile);
    
    var versions, hex;
    fs.readFile(jsonfile, function (err, body) {
        if (err && err.code === 'ENOENT') body = Buffer('[]');
        else if (err) return cb(err);
        
        try { versions = JSON.parse(body.toString('utf8')) }
        catch (err) { return cb(err) }
        
        var versionExists = versions.some(function (ref) {
            return ref.boot && ref.version === VERSION;
        });
        if (versionExists) {
            return cb(new Error(
                'cannot modify pre-existing version: ' + VERSION
            ));
        }
        
        var pending = 2;
        var w = fs.createWriteStream(tmpfile);
        w.on('finish', function () { if (-- pending === 0) done() });
        var h = createHash('sha256');
        h.pipe(concat(function (body) {
            hex = body.toString('hex');
            if (-- pending === 0) done();
        }));
        
        input.pipe(w);
        input.pipe(h);
    });
    
    function done () {
        var dstfile = path.join(dir, hex + '.html');
        fs.rename(tmpfile, dstfile, function (err) {
            if (err) cb(err)
            else updateJson()
        });
    }
    
    function updateJson () {
        var ref = {
            boot: true,
            hash: hex,
            version: VERSION
        };
        versions.push(ref);
        var src = JSON.stringify(versions, null, 2) + '\n';
        fs.writeFile(jsonfile, src, function (err) {
            if (err) cb(err)
            else cb(null, hex)
        });
    }
};
