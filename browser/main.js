var xhr = require('xhr');

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
    xhr('data/' + hash, function (err, res, body) {
        console.log('body=', body);
        console.log('res=', res);
        if (err) {} // ...
        if (!body || !/^2/.test(res.statusCode)) return; // ...
        iframe.setAttribute('src', 'data:text/html;base64,' + btoa(body));
    });
}
