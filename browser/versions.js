var isarray = require('isarray');
var semver = require('semver');
var has = require('has');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var classList = require('class-list');
var hyperglue = require('hyperglue');

var template = require('./templates.js');

inherits(Versions, EventEmitter);
module.exports = Versions;

function Versions (root) {
    var self = this;
    if (!(this instanceof Versions)) return new Versions(root);
    self.root = root;
    
    self.lvers = getLocalVersions();
    process.nextTick(function () {
        self.lvers.forEach(function (v) {
            self.show(v);
        });
    });
    
    self.lhashes = {};
    self.lnums = {};
    self.lvers.forEach(function (v) {
        self.lnums[v.version] = v;
        self.lhashes[v.hash] = v;
    });
    self.elements = {};
}

Versions.prototype.show = function (v) {
    var elem = template.version({
        '.ver': v.version,
        '.hash': v.hash,
        '.message': v.message,
        '.saved': v.saved ? 'saved' : ''
    });
    this.elements[v.hash] = elem;
    if (this._currentHash === v.hash) this.select(v.hash);
    
    for (var i = 1; i < this.root.children.length; i++) {
        var c = this.root.children[i];
        var cver = c.querySelector('.ver').textContent;
        if (semver.gt(v.version, cver)) {
            this.root.insertBefore(elem, c);
            this.emit('version', v, elem);
            return;
        }
    }
    this.root.appendChild(elem);
    this.emit('version', v, elem);
};

Versions.prototype.latest = function () {
    var max = this.lvers[0];
    for (var i = 1; i < this.lvers.length; i++) {
        if (semver.gt(this.lvers[i].version, max.version)) {
            max = this.lvers[i];
        }
    }
    return max;
};

Versions.prototype.select = function (hash) {
    if (this._currentElem) classList(this._currentElem).remove('current')
    var elem = this.elements[hash];
    this._currentHash = hash;
    if (elem) {
        this._currentElem = elem;
        classList(elem).add('current');
    }
};

Versions.prototype.saved = function (hash) {
    this.lhashes[hash].saved = true;
    var elem = this.elements[hash];
    var ix = [].indexOf.call(elem.parentNode.children, elem);
    hyperglue(elem, { '.saved': 'saved' });
    elem.parentNode.insertBefore(elem, elem.parentNode.children[ix]);
    localStorage.setItem('hyperboot-versions', JSON.stringify(this.lvers));
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
    for (var i = 0; i < this.lvers.length; i++) {
        var v = this.lvers[i];
        this.lhashes[v.hash] = v;
        this.lnums[v.version] = v;
    }
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
