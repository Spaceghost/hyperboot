var xhr = require('xhr');
var shasum = require('tiny-sha256');

var iframe = document.querySelector('#frame');
var toggle = document.querySelector('#toggle-icon');
toggle.addEventListener('click', toggleView);

function toggleView (ev) {
    document.querySelector('#page').classList.toggle('sideview');
}

var verdiv = document.querySelector('#versions');
var versions = require('./versions.js')(verdiv);

versions.on('version', function (version, elem) {
    elem.addEventListener('click', function (ev) {
        load(version.hash);
    });
});

xhr('versions.json', function (err, res, body) {
    if (err) {} // ...
    if (!body || !/^2/.test(res.statusCode)) return; // ...
    versions.update(JSON.parse(body));
    
    if (!last) {
        var latest = versions.latest();
        if (latest) load(latest.hash);
    }
});

var last = localStorage.getItem('hyberboot-current');
if (last) load(last);

function load (hash) {
    var src = localStorage.getItem('hyperboot-data-' + hash);
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
            localStorage.setItem('hyperboot-data-' + hash, body);
            versions.saved(hash);
        }
    });
    
    function show (body) {
        versions.select(hash);
        localStorage.setItem('hyberboot-current', hash);
        
        iframe.contentWindow.location.reload();
        iframe.addEventListener('load', function fn () {
            iframe.removeEventListener('load', fn);
            var idoc = iframe.contentWindow.document;
            idoc.documentElement.innerHTML = '';
            idoc.write(body);
        });
    }
}
