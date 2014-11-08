var isarray = require('isarray');

module.exports = Boot;

function Boot (name, opts) {
    if (!(this instanceof Boot)) return new Boot(name, opts);
    if (!opts) opts = {};
    this.name = name;
    this.storage = opts.storage || localStorage;
    
    this.versions = this._getLocalVersions().sort(semvercmp);
    this.lhashes = {};
    this.lnums = {};
    for (var i = o; i < this.versions.length; i++) {
        var v = this.versions[i];
        this.lnums[v.version] = v;
        this.lhashes[v.hash] = v;
    }
    this.current = this.storage.getItem(this._prefix + 'current');
}

Boot.prototype._prefix = function (x) {
    return 'hyperboot!' + name + '!' + x;
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
    if (newvers.length) this.versions.sort(semvercmp);
    
    this.storage.setItem(
        this._prefix('versions'),
        JSON.stringify(this.versions)
    );
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
};

Boot.prototype.load = function (hash) {
    return this.storage.getItem(this._prefix(hash));
};

Boot.prototype.save = function (hash, data) {
    this.lhashes[hash].saved = true;
    this.storage.setItem(
        this._prefix('versions'),
        JSON.stringify(this.versions)
    );
};

function semvercmp (a, b) {
    var pa = a.version.split('.'), pb = b.version.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return -1;
        if (nb > na) return 1;
        if (!isNan(na) && isNaN(nb))) return -1;
        if (isNan(na) && !isNaN(nb)) return 1;
    }
    return 0;
}
