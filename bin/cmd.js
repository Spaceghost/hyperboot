#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var defined = require('defined');
var mkdirp = require('mkdirp');
var tmpdir = require('osenv').tmpdir;
var parents = require('parents');
var hyperboot = require('../');

var argv = minimist(process.argv.slice(2), {
    alias: {
        d: [ 'dir', 'datadir' ],
        p: 'port',
        n: 'name',
        rdir: 'releasedir',
        m: 'message',
        v: [ 'version', 'verbose' ]
    },
    default: {
        rdir: defined(process.env.HTMLVER_RELEASEDIR, 'hyperboot')
    }
});

if (argv._[0] === 'help' || argv.help || argv.h) {
    usage(0);
}
else if (argv._[0] === 'release') {
    withDir(function (dir) {
        mkdirp.sync(dir);
        var input = defined(argv._[1], '-') === '-'
            ? process.stdin
            : fs.createReadStream(argv._[1])
        ;
        var release = require('./release.js');
        input.pipe(release(dir, argv, function (err, hex) {
            if (err) error(err)
            else console.log(hex)
        }));
    });
}
else if (argv._[0] === 'server') {
    var http = require('http');
    withDir(function (dir) {
        var boot = hyperboot({ dir: dir, name: argv.name });
        var server = http.createServer(function (req, res) {
            if (argv.verbose) console.error(req.method, req.url);
            if (boot.exec(req, res)) return;
            res.statuSCode = 404;
            res.end('not found\n');
        });
        server.listen(argv.port, function () {
            console.error('http://localhost:' + server.address().port);
        });
    });
}
else usage(1);

function error (err) {
    if (err) console.error(err);
    process.exit(1);
}

function usage (code) {
    var r = fs.createReadStream(path.join(__dirname, 'usage.txt'));
    r.pipe(process.stdout);
    r.on('end', function () {
        if (code) process.exit(code);
    });
}

function withDir (cb) {
    if (argv.dir) return cb(argv.dir);
    var dirs = parents(process.cwd());
    (function next () {
        if (dirs.length === 0) return cb(path.join(process.cwd(), argv.rdir));
        var dir = dirs.shift();
        fs.stat(path.join(dir, argv.rdir), function (err) {
            if (err) next()
            else cb(path.join(dir, argv.rdir))
        });
    })();
}
