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
    if (!(this instanceof Versions)) return new Versions(root);
    this.root = root;
    this.elements = {};
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
        if (semgt(v.version, cver)) {
            this.root.insertBefore(elem, c);
            this.emit('version', v, elem);
            return;
        }
    }
    this.root.appendChild(elem);
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
