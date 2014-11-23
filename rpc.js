var RPC = require('frame-rpc');
var rpc = RPC(window, window.parent, document.referrer);

exports.rpc = rpc;

exports.configure = function () {
    rpc.apply('configure', [].slice.call(arguments));
};

// future more stuff! install, search, launch another program
