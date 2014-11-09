var xhr = require('xhr');
var shasum = require('sha256');
var hyperboot = require('./index.js');

var iframe = document.querySelector('#frame');
var toggle = document.querySelector('#toggle-icon');
toggle.addEventListener('click', toggleView);

var appname = document.querySelector('*[data-name]').textContent;
var boot = hyperboot(appname);

function toggleView (ev) {
    document.querySelector('#page').classList.toggle('sideview');
}

var verdiv = document.querySelector('#versions');
var versions = require('./versions.js')(verdiv);

versions.on('version', function (version, elem) {
    elem.addEventListener('click', function (ev) {
        boot.select(version.hash);
    });
});

versions.update(boot.versions);
boot.on('update', function (newvers) { versions.update(newvers) });
boot.on('save', function (hash) { versions.save(hash) });

xhr('versions.json', function (err, res, body) {
    if (err) {} // ...
    if (!body || !/^2/.test(res.statusCode)) return; // ...
    boot.update(JSON.parse(body));
    
    if (!boot.current && boot.versions.length) {
        boot.select(boot.versions[boot.versions.length - 1].hash);
    }
});

boot.on('select', onselect);
if (boot.current) boot.select(boot.current);

function onselect (hash) {
    var src = boot.load(hash);
    if (src && shasum(src) === hash) return show(src);
    
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
            show(body);
            boot.save(hash, body);
        }
    });
    
    function show (body) {
        versions.select(hash);
        
        iframe.contentWindow.location.reload();
        iframe.addEventListener('load', function fn () {
            iframe.removeEventListener('load', fn);
            var idoc = iframe.contentWindow.document;
            idoc.documentElement.innerHTML = '';
            idoc.write(body);
        });
    }
}
