var fs = require('fs');
var path = require('path');
var defined = require('defined');
var createHash = require('crypto').createHash;
var concat = require('concat-stream');
var through = require('through2');
var tmpdir = require('osenv').tmpdir;

var upgrade = require('./upgrade.js');

module.exports = function (dir, opts, cb) {
    var tmpfile = path.join(
        tmpdir(), '.hyperboot-' + Date.now() + '-' + Math.random()
    );
    var jsonfile = path.join(dir, 'versions.json');
    var input = through();
    if (!opts.version) return errnext('version not provided');
    
    var versions, hex;
    fs.readFile(jsonfile, function (err, body) {
        if (err && err.code === 'ENOENT') body = Buffer('[]');
        else if (err) return cb(err);
        
        try { versions = JSON.parse(body.toString('utf8')) }
        catch (err) { return cb(err) }
        
        var versionExists = versions.some(function (ref) {
            return ref.version === opts.version;
        });
        if (versionExists) {
            return cb(new Error(
                'cannot modify pre-existing version: ' + opts.version
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
    
    return input;
    
    function done () {
        var dstfile = path.join(dir, hex + '.html');
        fs.rename(tmpfile, dstfile, function (err) {
            if (err) cb(err)
            else updateJson()
        });
    }
    
    function updateJson () {
        var ref = { hash: hex };
        if (opts.version) ref.version = opts.version;
        if (opts.message) ref.message = opts.message;
        
        versions.push(ref);
        var bootExists = versions.some(function (v) { return v.boot });
        
        var src = JSON.stringify(versions, null, 2) + '\n';
        fs.writeFile(jsonfile, src, function (err) {
            if (err) cb(err)
            else if (!bootExists) postAddBoot(hex)
            else cb(null, hex)
        });
    }
    
    function postAddBoot (hex) {
        upgrade(dir, function (err, boothex) {
            if (err) error(err)
            else cb(null, hex)
        });
    }
    
    function errnext (msg) {
        process.nextTick(function () { cb(new Error(msg)) });
        return input;
    }
};
