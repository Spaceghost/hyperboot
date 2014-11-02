var xhr = require('xhr');
var hyperglue = require('hyperglue');
var isarray = require('isarray');
var semver = require('semver');
var has = require('has');

var templateNodes = document.querySelectorAll('*[template]');
var template = {};
for (var i = 0; i < templateNodes.length; i++) {
    var t = templateNodes[i];
    template[t.getAttribute('template')] = function (vars) {
        var elem = t.cloneNode(true);
        elem.removeAttribute('template');
        return hyperglue(elem, vars);
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

var verdiv = document.querySelector('#versions');
function showVersion (v) {
    var elem = template.version({
        '.ver': v.version,
        '.hash': v.hash,
        '.message': v.message
    });
    for (var i = 1; i < verdiv.children.length; i++) {
        var c = verdiv.children[i];
        var cver = c.querySelector('.ver').textContent;
        if (semver.gt(v.version, cver)) {
            return verdiv.insertBefore(elem, c);
        }
    }
    verdiv.appendChild(elem);
}

var lvers = getLocalVersions();
lvers.forEach(showVersion);

var lhashes = {}, lnums = {};
lvers.forEach(function (v) {
    lnums[v.version] = v;
    lhashes[v.hash] = v;
});

xhr('versions.json', function (err, res, body) {
    if (!body || !/^2/.test(res.statusCode)) return;
    var rvers = JSON.parse(body);
    var newvers = [];
    
    rvers.forEach(function (v) {
        if (has(lhashes, v.hash)) {
            var lv = lhashes[v.hash];
            if (lv.message !== v.message) {} // conflict!
            else if (lv.version !== v.version) {} // conflict!
            else {} // ok...
        }
        else if (has(lnums, v.version)) {
            var lv = lnums[v.version];
            if (lv.message !== v.message) {} // conflict!
            else if (lv.version !== v.version) {} // conflict!
            else {} // ok...
        }
        else newvers.push(v);
    });
    
    lvers.push.apply(lvers, newvers);
    localStorage.setItem('hyperboot-versions', JSON.stringify(lvers));
    newvers.forEach(showVersion);
});

function getLocalVersions () {
    try {
        var s = localStorage.getItem('hyperboot-versions') || '[]';
        var versions = JSON.parse(s);
    }
    catch (err) { return [] }
    if (!isarray(versions)) return [];
    return versions;
}
