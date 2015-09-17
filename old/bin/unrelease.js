var fs = require('fs');
var path = require('path');
var defined = require('defined');

module.exports = function (dir, hash, cb) {
    var jsonfile = path.join(dir, 'versions.json');
    if (!hash) return cb(new Error('hash not provided'));
    
    fs.readFile(jsonfile, function (err, body) {
        if (err && err.code === 'ENOENT') body = Buffer('[]');
        else if (err) return cb(err);
        
        try { versions = JSON.parse(body.toString('utf8')) }
        catch (err) { return cb(err) }
        
        versions = versions.filter(function (v) {
            return v.hash !== hash;
        });
        
        var src = JSON.stringify(versions, null, 2) + '\n';
        fs.writeFile(jsonfile, src, done);
        fs.unlink(path.join(dir, hash + '.html'), done);
    });
    
    var pending = 2;
    function done (err) {
        if (err) return cb(err);
        if (-- pending === 0) cb(null);
    }
};
