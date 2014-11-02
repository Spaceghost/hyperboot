var isarray = require('isarray');
var semver = require('semver');
var has = require('has');

var template = require('./templates.js');

module.exports = Versions;

function Versions (root) {
    var self = this;
    if (!(this instanceof Versions)) return new Versions(root);
    self.root = root;
    
    self.lvers = getLocalVersions();
    self.lvers.forEach(function (v) { self.show(v) });
    
    self.lhashes = {};
    self.lnums = {};
    self.lvers.forEach(function (v) {
        self.lnums[v.version] = v;
        self.lhashes[v.hash] = v;
    });
}

Versions.prototype.show = function (v) {
    var elem = template.version({
        '.ver': v.version,
        '.hash': v.hash,
        '.message': v.message
    });
    for (var i = 1; i < this.root.children.length; i++) {
        var c = this.root.children[i];
        var cver = c.querySelector('.ver').textContent;
        if (semver.gt(v.version, cver)) {
            return this.root.insertBefore(elem, c);
        }
    }
    this.root.appendChild(elem);
};

Versions.prototype.update = function (rvers) {
    var self = this;
    var newvers = [];
    
    rvers.forEach(function (v) {
        if (has(self.lhashes, v.hash)) {
            var lv = self.lhashes[v.hash];
            if (lv.message !== v.message) {} // conflict!
            else if (lv.version !== v.version) {} // conflict!
            else {} // ok...
        }
        else if (has(self.lnums, v.version)) {
            var lv = self.lnums[v.version];
            if (lv.message !== v.message) {} // conflict!
            else if (lv.version !== v.version) {} // conflict!
            else {} // ok...
        }
        else newvers.push(v);
    });
    
    this.lvers.push.apply(this.lvers, newvers);
    localStorage.setItem('hyperboot-versions', JSON.stringify(this.lvers));
    if (newvers.length) newvers.forEach(function (v) { self.show(v) });
};

function getLocalVersions () {
    try {
        var s = localStorage.getItem('hyperboot-versions') || '[]';
        var versions = JSON.parse(s);
    }
    catch (err) { return [] }
    if (!isarray(versions)) return [];
    return versions;
}
