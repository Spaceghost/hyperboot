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

xhr('versions.json', function (err, res, body) {
    var versions = JSON.parse(body);
    console.log('versions=' + JSON.stringify(versions));
});
