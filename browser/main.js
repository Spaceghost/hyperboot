var xhr = require('xhr');

window.addEventListener('keydown', toggleView);
var iwin = document.querySelector('#frame').contentWindow;
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
        console.log('clicked:', version);
    });
});

xhr('versions.json', function (err, res, body) {
    if (!body || !/^2/.test(res.statusCode)) return;
    versions.update(JSON.parse(body));
});
