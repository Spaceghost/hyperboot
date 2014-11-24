var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var classList = require('class-list');
var semcmp = require('semver-compare');
var hyperglue = require('hyperglue');

function semgt (a, b) { return semcmp(a, b) === 1 }

var template = require('./templates.js');

inherits(Versions, EventEmitter);
module.exports = Versions;

function Versions (root) {
    var self = this;
    if (!(this instanceof Versions)) return new Versions(root);
    this.root = root;
    this.approot = root.querySelector('.app-versions');
    this.bootroot = root.querySelector('.boot-versions');
    this.elements = {};
}

Versions.prototype.show = function (v) {
    var tm = v.boot ? template['boot-version'] : template['app-version'];
    var elem = tm({
        '.ver': v.version,
        '.hash': v.hash,
        '.message': v.message || '',
        '.saved': v.saved ? 'saved' : ''
    });
    this.elements[v.hash] = elem;
    if (this._currentHash === v.hash) this.select(v.hash);
    if (this._loaderHash === v.hash) this.selectLoader(v.hash);
    
    var root = v.boot ? this.bootroot : this.approot;
    
    for (var i = 1; i < root.children.length; i++) {
        var c = root.children[i];
        var cver = c.querySelector('.ver').textContent;
        if (semgt(v.version, cver)) {
            root.insertBefore(elem, c);
            this.emit('version', v, elem);
            return;
        }
    }
    root.appendChild(elem);
    this.emit('version', v, elem);
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

Versions.prototype.selectLoader = function (hash) {
    if (this._loaderElem) classList(this._loaderElem).remove('current')
    var elem = this.elements[hash];
    this._loaderHash = hash;
    if (elem) {
        this._loaderElem = elem;
        classList(elem).add('current');
    }
};

Versions.prototype.update = function (newvers) {
    var self = this;
    if (newvers.length) newvers.forEach(function (v) { self.show(v) });
};

Versions.prototype.save = function (hash) {
    var elem = this.elements[hash];
    if (!elem) return;
    var ix = [].indexOf.call(elem.parentNode.children, elem);
    hyperglue(elem, { '.saved': 'saved' });
    elem.parentNode.insertBefore(elem, elem.parentNode.children[ix]);
};
