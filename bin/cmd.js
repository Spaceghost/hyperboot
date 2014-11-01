#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var defined = require('defined');
var mkdirp = require('mkdirp');
var tmpdir = require('osenv').tmpdir;

var argv = minimist(process.argv.slice(2), {
    alias: {
        d: [ 'dir', 'datadir' ],
        rdir: 'releasedir',
        m: 'message',
        v: 'version'
    },
    default: {
        rdir: defined(process.env.BOOTVER_RELEASEDIR, 'bootver_release')
    }
});
var dir = defined(argv.dir, path.join(process.cwd(), argv.rdir));

if (argv._[0] === 'help' || argv.help || argv.h) {
    usage(0);
}
else if (argv._[0] === 'release') {
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
