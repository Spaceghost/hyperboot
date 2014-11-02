var xhr = require('xhr');
var hyperglue = require('hyperglue');

var templateNodes = document.querySelectorAll('.template');
var template = {};
for (var i = 0; i < templateNodes.length; i++) {
    var t = templateNodes[i];
    template[t.getAttribute('template')] = function (vars) {
        var elem = t.cloneNode(true);
        elem.removeAttribute('template');
        return hyperglue(vars, elem);
    };
}

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
console.log('body=', body, res);
    var versions = JSON.parse(body);
    console.log('versions=' + JSON.stringify(versions));
    var verdiv = document.querySelector('#versions');
    Object.keys(versions).forEach(function (hash) {
        var v = versions[hash];
        verdiv.appendChild(template.version({
            '.version': v.version,
            '.hash': hash,
            '.message': v.message
        }));
    });
});
