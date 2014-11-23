var RPC = require('frame-rpc');
var rpc = RPC(window, window.parent, '*');

exports.rpc = rpc;

exports.configure = function () {
    rpc.apply('configure', [].slice.call(arguments));
};

// future more stuff! install, search, launch another program
