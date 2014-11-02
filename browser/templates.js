var hyperglue = require('hyperglue');

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
module.exports = template;
