console.log('// welcome to hyperboot!');
console.log('// available globals: boot, ui');

var xhr = require('xhr');
var shasum = require('sha256');
var hyperboot = require('./index.js');
var UI = require('./ui.js');

var appname = document.querySelector('*[data-name]').textContent;
var boot = hyperboot(appname);

var ui = UI(boot, {
    iframe: '#frame',
    versions: '#versions',
    page: '#page',
    sidebar: '#sidebar'
});

window.boot = boot;
window.ui = ui;

xhr('versions.json', function (err, res, body) {
    if (err) {} // ...
    if (!body || !/^2/.test(res.statusCode)) return; // ...
    boot.update(JSON.parse(body));
    
    if (!boot.current && /^#h=[0-9a-f]{32,}$/.test(location.hash)) {
        boot.select(location.hash.replace(/^#h=/, ''));
    }
    else if (!boot.current && boot.versions.length
    && location.hash !== '#v') {
        boot.select(boot.versions[boot.versions.length - 1].hash);
    }
});

boot.on('select', onselect);

window.addEventListener('hashchange', checkhashes);

if (checkhashes()) {}
else if (boot.current) boot.select(boot.current);

function checkhashes (ev) {
    if (location.hash === '#v') {
        ui.show();
        return true;
    }
    ui.hide();
    
    if (/^#h=[0-9a-f]{32,}$/.test(location.hash)) {
        boot.select(location.hash.replace(/^#h=/, ''));
        return true;
    }
    return false;
}

function onselect (hash) {
    if (boot.has(hash)) return ui.select(hash);
    
    xhr('data/' + hash, function (err, res, body) {
        if (err) {
            console.error(err);
        }
        else if (!body || !/^2/.test(res.statusCode)) {
            console.error('error code ' + res.statusCode);
        }
        else if (shasum(body) !== hash) {
            console.error('hash mismatch\n');
        }
        else {
            boot.save(hash, body);
            ui.select(hash);
        }
    });
}
