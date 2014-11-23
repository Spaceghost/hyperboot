var Versions = require('./versions.js');
var classList = require('class-list');

module.exports = UI;

function UI (boot, elements) {
    var self = this;
    if (!(this instanceof UI)) return new UI(boot, elements);
    this.boot = boot;
    this.elements = {
        iframe: getElem(elements.iframe),
        versions: getElem(elements.versions),
        page: getElem(elements.page),
        sidebar: getElem(elements.sidebar)
    };
    this.versions = Versions(this.elements.versions);
    this.versions.on('version', function (version, elem) {
        elem.addEventListener('click', function (ev) {
            self.boot.select(version.hash);
        });
    });
    this.versions.update(this.boot.versions);
    this.boot.on('update', function (newvers) {
        self.versions.update(newvers);
    });
    this.boot.on('save', function (hash) {
        self.versions.save(hash);
    });
    
    var close = this.elements.sidebar.querySelector('.close');
    close.addEventListener('click', function () {
        self.hide();
    });
}

UI.prototype.select = function (hash) {
    var iframe = this.elements.iframe;
    var src = this.boot.load(hash);
    this.versions.select(hash);
    
    iframe.contentWindow.location.reload();
    iframe.addEventListener('load', function fn () {
        iframe.removeEventListener('load', fn);
        var idoc = iframe.contentWindow.document;
        idoc.documentElement.innerHTML = '';
        idoc.write(src);
    });
};

UI.prototype.toggle = function () {
    classList(this.elements.page).toggle('sideview');
};

UI.prototype.show = function () {
    classList(this.elements.page).add('sideview');
};

UI.prototype.hide = function () {
    classList(this.elements.page).remove('sideview');
};

function getElem (x) {
    if (typeof x === 'string') return document.querySelector(x);
    return x;
}
