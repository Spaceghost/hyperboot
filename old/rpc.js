var RPC = require('frame-rpc');
var rpc = RPC(window, window.parent, '*');

exports.rpc = rpc;

exports.show = function () {
    rpc.apply('show', [].slice.call(arguments));
};

exports.hide = function () {
    rpc.apply('hide', [].slice.call(arguments));
};

exports.toggle = function () {
    rpc.apply('toggle', [].slice.call(arguments));
};

// future more stuff! install, search, launch another program
