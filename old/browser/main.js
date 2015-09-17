console.log('// WELCOME TO HYPERBOOT!');
console.log('// Available globals: boot, ui');
console.log('// Try this here in the REPL: ui.toggle()')

var xhr = require('xhr');
var shasum = require('sha256');
var RPC = require('frame-rpc');
var hyperboot = require('./index.js');
var UI = require('./ui.js');

var appname = window.APPNAME
    || document.querySelector('*[data-name]').textContent
;
var boot = hyperboot(appname);

var ui = UI(boot, {
    iframe: '#frame',
    versions: '#versions',
    page: '#page',
    sidebar: '#sidebar'
});

var origin = location.protocol + '//' + location.host;
var rpc = RPC(window, ui.elements.iframe.contentWindow, origin, {
    show: function () { ui.show() },
    hide: function () { ui.hide() },
    toggle: function () { ui.toggle() },
    versions: function (cb) {
        cb({
            current: boot.current,
            available: boot.versions
        });
    }
});

window.addEventListener('message', function (ev) {
    ui.elements.iframe.contentWindow.postMessage(ev.data, '*');
});

window.boot = boot;
window.ui = ui;

xhr('versions.json', function (err, res, body) {
    if (err) {} // ...
    if (!body || !/^2/.test(res.statusCode)) return; // ...
    boot.update(JSON.parse(body));
    var appvers = boot.versions.filter(function (v) { return !v.boot });
    
    if (!boot.current && /^#h=[0-9a-f]{32,}$/.test(location.hash)) {
        boot.select(location.hash.replace(/^#h=/, ''));
    }
    else if (!boot.current && appvers.length && location.hash !== '#v') {
        boot.select(appvers[appvers.length - 1].hash);
    }
});

boot.on('select', function (hash) {
    onselect(hash, function () { ui.select(hash) });
});

boot.on('loader', function (hash) {
    onselect(hash, function () {
        location.reload();
    });
});

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

function onselect (hash, cb) {
    if (boot.has(hash)) return cb();
    
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
            cb();
        }
    });
}
