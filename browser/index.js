var isarray = require('isarray');
var has = require('has');
var semvercmp = require('semver-compare');
var shasum = require('sha256');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

function vercmp (a, b) { return semvercmp(a.version, b.version) }

module.exports = Boot;
inherits(Boot, EventEmitter);

function Boot (name, opts) {
    if (!(this instanceof Boot)) return new Boot(name, opts);
    if (!opts) opts = {};
    this.name = name;
    this.storage = opts.storage || localStorage;
    
    this.versions = this._getLocalVersions().sort(vercmp);
    this.lhashes = {};
    this.lnums = {};
    for (var i = 0; i < this.versions.length; i++) {
        var v = this.versions[i];
        this.lnums[v.version] = v;
        this.lhashes[v.hash] = v;
    }
    this.current = this.storage.getItem(this._prefix('current'));
}

Boot.prototype._prefix = function (x) {
    return 'hyperboot!' + this.name + '!' + x;
};

Boot.prototype.update = function (rvers) {
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
    
    this.versions.push.apply(this.versions, newvers);
    for (var i = 0; i < newvers.length; i++) {
        var v = newvers[i];
        this.lhashes[v.hash] = v;
        this.lnums[v.version] = v;
    }
    if (newvers.length) this.versions.sort(vercmp);
    
    this.storage.setItem(
        this._prefix('versions'),
        JSON.stringify(this.versions)
    );
    this.emit('update', newvers);
    return newvers;
};

Boot.prototype._getLocalVersions = function () {
    try {
        var s = this.storage.getItem(this._prefix('versions')) || '[]';
        var versions = JSON.parse(s);
    }
    catch (err) { return [] }
    if (!isarray(versions)) return [];
    return versions;
};

Boot.prototype.select = function (hash) {
    this.current = hash;
    this.storage.setItem(this._prefix('current'), hash);
    this.emit('select', hash);
};

Boot.prototype.load = function (hash) {
    var src = this.storage.getItem(this._prefix(hash));
    if (src && shasum(src) === hash) return src;
};

Boot.prototype.has = function (hash) {
    return has(this.storage, this._prefix(hash));
};

Boot.prototype.save = function (hash, src) {
    this.storage.setItem(this._prefix(hash), src);
    this.lhashes[hash].saved = true;
    this.storage.setItem(
        this._prefix('versions'),
        JSON.stringify(this.versions)
    );
    this.emit('save', hash);
};
