var hyperglue = require('hyperglue');

var templateNodes = document.querySelectorAll('*[template]');
var template = {};
for (var i = 0; i < templateNodes.length; i++) (function (t) {
    template[t.getAttribute('template')] = function (vars) {
        var elem = t.cloneNode(true);
        elem.removeAttribute('template');
        return hyperglue(elem, vars);
    };
})(templateNodes[i]);
module.exports = template;
