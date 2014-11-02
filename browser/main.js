var xhr = require('xhr');
var shasum = require('sha256');

window.addEventListener('keydown', toggleView);
var iframe = document.querySelector('#frame');
var iwin = iframe.contentWindow;
iwin.addEventListener('keydown', toggleView);

function toggleView (ev) {
    if (ev.which === 119) {
        ev.preventDefault();
        document.querySelector('#page').classList.toggle('sideview');
    }
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
});

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
        }
    });
    
    function show (body) {
        iframe.setAttribute('src', 'data:text/html;base64,' + btoa(body));
    }
}
