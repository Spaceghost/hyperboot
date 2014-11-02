(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/substack/projects/hyperboot/browser/main.js":[function(require,module,exports){
var xhr = require('xhr');
var hyperglue = require('hyperglue');

var templateNodes = document.querySelectorAll('.template');
var template = {};
for (var i = 0; i < templateNodes.length; i++) {
    var t = templateNodes[i];
    template[t.getAttribute('template')] = function (vars) {
        var elem = t.cloneNode(true);
        elem.removeAttribute('template');
        return hyperglue(vars, elem);
    };
}

window.addEventListener('keydown', toggleView);
var iwin = document.querySelector('#frame').contentWindow;
iwin.addEventListener('keydown', toggleView);

function toggleView (ev) {
    if (ev.which === 119) {
        ev.preventDefault();
        document.querySelector('#page').classList.toggle('sideview');
    }
}

xhr('versions.json', function (err, res, body) {
console.log('body=', body, res);
    var versions = JSON.parse(body);
    console.log('versions=' + JSON.stringify(versions));
    var verdiv = document.querySelector('#versions');
    Object.keys(versions).forEach(function (hash) {
        var v = versions[hash];
        verdiv.appendChild(template.version({
            '.version': v.version,
            '.hash': hash,
            '.message': v.message
        }));
    });
});

},{"hyperglue":"/home/substack/projects/hyperboot/node_modules/hyperglue/browser.js","xhr":"/home/substack/projects/hyperboot/node_modules/xhr/index.js"}],"/home/substack/projects/hyperboot/node_modules/hyperglue/browser.js":[function(require,module,exports){
var domify = require('domify');
module.exports = hyperglue;

var outer = null;

function hyperglue (src, updates) {
    if (!updates) updates = {};
    
    var dom = typeof src === 'object' ? [ src ] : domify(src);
    if (!outer) outer = document.createElement('div');
    
    forEach(objectKeys(updates), function (selector) {
        var value = updates[selector];
        forEach(dom, function (d) {
            var parentNode = d.parentNode;
            
            if (selector === ':first') {
                bind(d, value);
            }
            else if (/:first$/.test(selector)) {
                var k = selector.replace(/:first$/, '');
                if (parentNode) parentNode.removeChild(d);
                outer.appendChild(d);
                
                var elem = outer.querySelector(k);
                outer.removeChild(d);
                
                if (parentNode) parentNode.appendChild(d);
                if (elem) bind(elem, value);
            }
            else {
                if (parentNode) parentNode.removeChild(d);
                outer.appendChild(d);
                
                var nodes = d.parentNode.querySelectorAll(selector);
                outer.removeChild(d);
                
                if (parentNode) parentNode.appendChild(d);
                
                if (nodes.length === 0) return;
                for (var i = 0; i < nodes.length; i++) {
                    bind(nodes[i], value);
                }
            }
        });
    });
    return dom.length === 1 ? dom[0] : dom;
}

function bind (node, value) {
    if (isElement(value)) {
        node.innerHTML = '';
        node.appendChild(value);
    }
    else if (isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            var e = hyperglue(node.cloneNode(true), value[i]);
            node.parentNode.insertBefore(e, node);
        }
        node.parentNode.removeChild(node);
    }
    else if (value && typeof value === 'object') {
        forEach(objectKeys(value), function (key) {
            if (key === '_text') {
                setText(node, value[key]);
            }
            else if (key === '_html' && isElement(value[key])) {
                node.innerHTML = '';
                node.appendChild(value[key]);
            }
            else if (key === '_html') {
                node.innerHTML = value[key];
            }
            else node.setAttribute(key, value[key]);
        });
    }
    else setText(node, value);
}

function forEach(xs, f) {
    if (xs.forEach) return xs.forEach(f);
    for (var i = 0; i < xs.length; i++) f(xs[i], i)
}

var objectKeys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

function isElement (e) {
    return e && typeof e === 'object' && e.childNodes
        && (typeof e.appendChild === 'function'
        || typeof e.appendChild === 'object')
    ;
}

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

function setText (e, s) {
    e.innerHTML = '';
    var txt = document.createTextNode(String(s));
    e.appendChild(txt);
}

},{"domify":"/home/substack/projects/hyperboot/node_modules/hyperglue/node_modules/domify/index.js"}],"/home/substack/projects/hyperboot/node_modules/hyperglue/node_modules/domify/index.js":[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');
  
  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) throw new Error('No elements were generated.');
  var tag = m[1];
  
  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return [el.removeChild(el.lastChild)];
  }
  
  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  return orphan(el.children);
}

/**
 * Orphan `els` and return an array.
 *
 * @param {NodeList} els
 * @return {Array}
 * @api private
 */

function orphan(els) {
  var ret = [];

  while (els.length) {
    ret.push(els[0].parentNode.removeChild(els[0]));
  }

  return ret;
}

},{}],"/home/substack/projects/hyperboot/node_modules/xhr/index.js":[function(require,module,exports){
var window = require("global/window")
var once = require("once")
var parseHeaders = require('parse-headers')

var messages = {
    "0": "Internal XMLHttpRequest Error",
    "4": "4xx Client Error",
    "5": "5xx Server Error"
}

var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new XDR()
        }else{
            xhr = new XHR()
        }
    }

    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var key
    var load = options.response ? loadResponse : loadXhr

    if ("json" in options) {
        isJson = true
        headers["Accept"] = "application/json"
        if (method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = load
    xhr.onerror = error
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    // hate IE
    xhr.ontimeout = noop
    xhr.open(method, uri, !sync)
                                    //backward compatibility
    if (options.withCredentials || (options.cors && options.withCredentials !== false)) {
        xhr.withCredentials = true
    }

    // Cannot set timeout with sync request
    if (!sync) {
        xhr.timeout = "timeout" in options ? options.timeout : 5000
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }
    
    if ("beforeSend" in options && 
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr

    function readystatechange() {
        if (xhr.readyState === 4) {
            load()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = null

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === 'text' || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    function getStatusCode() {
        return xhr.status === 1223 ? 204 : xhr.status
    }

    // if we're getting a none-ok statusCode, build & return an error
    function errorFromStatusCode(status) {
        var error = null
        if (status === 0 || (status >= 400 && status < 600)) {
            var message = (typeof body === "string" ? body : false) ||
                messages[String(status).charAt(0)]
            error = new Error(message)
            error.statusCode = status
        }

        return error
    }

    // will load the data & process the response in a special response object
    function loadResponse() {
        var status = getStatusCode()
        var error = errorFromStatusCode(status)
        var response = {
            body: getBody(),
            statusCode: status,
            statusText: xhr.statusText,
            raw: xhr
        }
        if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
            response.headers = parseHeaders(xhr.getAllResponseHeaders())
        } else {
            response.headers = {}
        }

        callback(error, response, response.body)
    }

    // will load the data and add some response properties to the source xhr
    // and then respond with that
    function loadXhr() {
        var status = getStatusCode()
        var error = errorFromStatusCode(status)

        xhr.status = xhr.statusCode = status
        xhr.body = getBody()
        xhr.headers = parseHeaders(xhr.getAllResponseHeaders())

        callback(error, xhr, xhr.body)
    }

    function error(evt) {
        callback(evt, xhr)
    }
}


function noop() {}

},{"global/window":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/global/window.js","once":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/once/once.js","parse-headers":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/parse-headers.js"}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/global/window.js":[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/once/once.js":[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/for-each/index.js":[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/for-each/node_modules/is-function/index.js"}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/for-each/node_modules/is-function/index.js":[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/trim/index.js":[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/parse-headers.js":[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/for-each/index.js","trim":"/home/substack/projects/hyperboot/node_modules/xhr/node_modules/parse-headers/node_modules/trim/index.js"}]},{},["/home/substack/projects/hyperboot/browser/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIuLi9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyL21haW4uanMiLCJub2RlX21vZHVsZXMvaHlwZXJnbHVlL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvaHlwZXJnbHVlL25vZGVfbW9kdWxlcy9kb21pZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMveGhyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3hoci9ub2RlX21vZHVsZXMvZ2xvYmFsL3dpbmRvdy5qcyIsIm5vZGVfbW9kdWxlcy94aHIvbm9kZV9tb2R1bGVzL29uY2Uvb25jZS5qcyIsIm5vZGVfbW9kdWxlcy94aHIvbm9kZV9tb2R1bGVzL3BhcnNlLWhlYWRlcnMvbm9kZV9tb2R1bGVzL2Zvci1lYWNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3hoci9ub2RlX21vZHVsZXMvcGFyc2UtaGVhZGVycy9ub2RlX21vZHVsZXMvZm9yLWVhY2gvbm9kZV9tb2R1bGVzL2lzLWZ1bmN0aW9uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3hoci9ub2RlX21vZHVsZXMvcGFyc2UtaGVhZGVycy9ub2RlX21vZHVsZXMvdHJpbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy94aHIvbm9kZV9tb2R1bGVzL3BhcnNlLWhlYWRlcnMvcGFyc2UtaGVhZGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB4aHIgPSByZXF1aXJlKCd4aHInKTtcbnZhciBoeXBlcmdsdWUgPSByZXF1aXJlKCdoeXBlcmdsdWUnKTtcblxudmFyIHRlbXBsYXRlTm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudGVtcGxhdGUnKTtcbnZhciB0ZW1wbGF0ZSA9IHt9O1xuZm9yICh2YXIgaSA9IDA7IGkgPCB0ZW1wbGF0ZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHQgPSB0ZW1wbGF0ZU5vZGVzW2ldO1xuICAgIHRlbXBsYXRlW3QuZ2V0QXR0cmlidXRlKCd0ZW1wbGF0ZScpXSA9IGZ1bmN0aW9uICh2YXJzKSB7XG4gICAgICAgIHZhciBlbGVtID0gdC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCd0ZW1wbGF0ZScpO1xuICAgICAgICByZXR1cm4gaHlwZXJnbHVlKHZhcnMsIGVsZW0pO1xuICAgIH07XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdG9nZ2xlVmlldyk7XG52YXIgaXdpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmcmFtZScpLmNvbnRlbnRXaW5kb3c7XG5pd2luLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0b2dnbGVWaWV3KTtcblxuZnVuY3Rpb24gdG9nZ2xlVmlldyAoZXYpIHtcbiAgICBpZiAoZXYud2hpY2ggPT09IDExOSkge1xuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcGFnZScpLmNsYXNzTGlzdC50b2dnbGUoJ3NpZGV2aWV3Jyk7XG4gICAgfVxufVxuXG54aHIoJ3ZlcnNpb25zLmpzb24nLCBmdW5jdGlvbiAoZXJyLCByZXMsIGJvZHkpIHtcbmNvbnNvbGUubG9nKCdib2R5PScsIGJvZHksIHJlcyk7XG4gICAgdmFyIHZlcnNpb25zID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICBjb25zb2xlLmxvZygndmVyc2lvbnM9JyArIEpTT04uc3RyaW5naWZ5KHZlcnNpb25zKSk7XG4gICAgdmFyIHZlcmRpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN2ZXJzaW9ucycpO1xuICAgIE9iamVjdC5rZXlzKHZlcnNpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChoYXNoKSB7XG4gICAgICAgIHZhciB2ID0gdmVyc2lvbnNbaGFzaF07XG4gICAgICAgIHZlcmRpdi5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS52ZXJzaW9uKHtcbiAgICAgICAgICAgICcudmVyc2lvbic6IHYudmVyc2lvbixcbiAgICAgICAgICAgICcuaGFzaCc6IGhhc2gsXG4gICAgICAgICAgICAnLm1lc3NhZ2UnOiB2Lm1lc3NhZ2VcbiAgICAgICAgfSkpO1xuICAgIH0pO1xufSk7XG4iLCJ2YXIgZG9taWZ5ID0gcmVxdWlyZSgnZG9taWZ5Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IGh5cGVyZ2x1ZTtcblxudmFyIG91dGVyID0gbnVsbDtcblxuZnVuY3Rpb24gaHlwZXJnbHVlIChzcmMsIHVwZGF0ZXMpIHtcbiAgICBpZiAoIXVwZGF0ZXMpIHVwZGF0ZXMgPSB7fTtcbiAgICBcbiAgICB2YXIgZG9tID0gdHlwZW9mIHNyYyA9PT0gJ29iamVjdCcgPyBbIHNyYyBdIDogZG9taWZ5KHNyYyk7XG4gICAgaWYgKCFvdXRlcikgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBcbiAgICBmb3JFYWNoKG9iamVjdEtleXModXBkYXRlcyksIGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSB1cGRhdGVzW3NlbGVjdG9yXTtcbiAgICAgICAgZm9yRWFjaChkb20sIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50Tm9kZSA9IGQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnOmZpcnN0Jykge1xuICAgICAgICAgICAgICAgIGJpbmQoZCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoLzpmaXJzdCQvLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGsgPSBzZWxlY3Rvci5yZXBsYWNlKC86Zmlyc3QkLywgJycpO1xuICAgICAgICAgICAgICAgIGlmIChwYXJlbnROb2RlKSBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGQpO1xuICAgICAgICAgICAgICAgIG91dGVyLmFwcGVuZENoaWxkKGQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gb3V0ZXIucXVlcnlTZWxlY3RvcihrKTtcbiAgICAgICAgICAgICAgICBvdXRlci5yZW1vdmVDaGlsZChkKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkgcGFyZW50Tm9kZS5hcHBlbmRDaGlsZChkKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbSkgYmluZChlbGVtLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Tm9kZSkgcGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkKTtcbiAgICAgICAgICAgICAgICBvdXRlci5hcHBlbmRDaGlsZChkKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbm9kZXMgPSBkLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgb3V0ZXIucmVtb3ZlQ2hpbGQoZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudE5vZGUpIHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoZCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYmluZChub2Rlc1tpXSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRvbS5sZW5ndGggPT09IDEgPyBkb21bMF0gOiBkb207XG59XG5cbmZ1bmN0aW9uIGJpbmQgKG5vZGUsIHZhbHVlKSB7XG4gICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgbm9kZS5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlID0gaHlwZXJnbHVlKG5vZGUuY2xvbmVOb2RlKHRydWUpLCB2YWx1ZVtpXSk7XG4gICAgICAgICAgICBub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGUsIG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3JFYWNoKG9iamVjdEtleXModmFsdWUpLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnX3RleHQnKSB7XG4gICAgICAgICAgICAgICAgc2V0VGV4dChub2RlLCB2YWx1ZVtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSA9PT0gJ19odG1sJyAmJiBpc0VsZW1lbnQodmFsdWVba2V5XSkpIHtcbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQodmFsdWVba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChrZXkgPT09ICdfaHRtbCcpIHtcbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHZhbHVlW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGtleSwgdmFsdWVba2V5XSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHNldFRleHQobm9kZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZvckVhY2gpIHJldHVybiB4cy5mb3JFYWNoKGYpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIGYoeHNbaV0sIGkpXG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG5mdW5jdGlvbiBpc0VsZW1lbnQgKGUpIHtcbiAgICByZXR1cm4gZSAmJiB0eXBlb2YgZSA9PT0gJ29iamVjdCcgJiYgZS5jaGlsZE5vZGVzXG4gICAgICAgICYmICh0eXBlb2YgZS5hcHBlbmRDaGlsZCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICB8fCB0eXBlb2YgZS5hcHBlbmRDaGlsZCA9PT0gJ29iamVjdCcpXG4gICAgO1xufVxuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG5mdW5jdGlvbiBzZXRUZXh0IChlLCBzKSB7XG4gICAgZS5pbm5lckhUTUwgPSAnJztcbiAgICB2YXIgdHh0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKHMpKTtcbiAgICBlLmFwcGVuZENoaWxkKHR4dCk7XG59XG4iLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBXcmFwIG1hcCBmcm9tIGpxdWVyeS5cbiAqL1xuXG52YXIgbWFwID0ge1xuICBvcHRpb246IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddLFxuICBvcHRncm91cDogWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J10sXG4gIGxlZ2VuZDogWzEsICc8ZmllbGRzZXQ+JywgJzwvZmllbGRzZXQ+J10sXG4gIHRoZWFkOiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgdGJvZHk6IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddLFxuICB0Zm9vdDogWzEsICc8dGFibGU+JywgJzwvdGFibGU+J10sXG4gIGNvbGdyb3VwOiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgY2FwdGlvbjogWzEsICc8dGFibGU+JywgJzwvdGFibGU+J10sXG4gIHRyOiBbMiwgJzx0YWJsZT48dGJvZHk+JywgJzwvdGJvZHk+PC90YWJsZT4nXSxcbiAgdGQ6IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddLFxuICB0aDogWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J10sXG4gIGNvbDogWzIsICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsICc8L2NvbGdyb3VwPjwvdGFibGU+J10sXG4gIF9kZWZhdWx0OiBbMCwgJycsICcnXVxufTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiB0aGUgY2hpbGRyZW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2UoaHRtbCkge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuICBcbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnRzIHdlcmUgZ2VuZXJhdGVkLicpO1xuICB2YXIgdGFnID0gbVsxXTtcbiAgXG4gIC8vIGJvZHkgc3VwcG9ydFxuICBpZiAodGFnID09ICdib2R5Jykge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2h0bWwnKTtcbiAgICBlbC5pbm5lckhUTUwgPSBodG1sO1xuICAgIHJldHVybiBbZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKV07XG4gIH1cbiAgXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5pbm5lckhUTUwgPSBwcmVmaXggKyBodG1sICsgc3VmZml4O1xuICB3aGlsZSAoZGVwdGgtLSkgZWwgPSBlbC5sYXN0Q2hpbGQ7XG5cbiAgcmV0dXJuIG9ycGhhbihlbC5jaGlsZHJlbik7XG59XG5cbi8qKlxuICogT3JwaGFuIGBlbHNgIGFuZCByZXR1cm4gYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIHtOb2RlTGlzdH0gZWxzXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG9ycGhhbihlbHMpIHtcbiAgdmFyIHJldCA9IFtdO1xuXG4gIHdoaWxlIChlbHMubGVuZ3RoKSB7XG4gICAgcmV0LnB1c2goZWxzWzBdLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxzWzBdKSk7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuIiwidmFyIHdpbmRvdyA9IHJlcXVpcmUoXCJnbG9iYWwvd2luZG93XCIpXG52YXIgb25jZSA9IHJlcXVpcmUoXCJvbmNlXCIpXG52YXIgcGFyc2VIZWFkZXJzID0gcmVxdWlyZSgncGFyc2UtaGVhZGVycycpXG5cbnZhciBtZXNzYWdlcyA9IHtcbiAgICBcIjBcIjogXCJJbnRlcm5hbCBYTUxIdHRwUmVxdWVzdCBFcnJvclwiLFxuICAgIFwiNFwiOiBcIjR4eCBDbGllbnQgRXJyb3JcIixcbiAgICBcIjVcIjogXCI1eHggU2VydmVyIEVycm9yXCJcbn1cblxudmFyIFhIUiA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCB8fCBub29wXG52YXIgWERSID0gXCJ3aXRoQ3JlZGVudGlhbHNcIiBpbiAobmV3IFhIUigpKSA/IFhIUiA6IHdpbmRvdy5YRG9tYWluUmVxdWVzdFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVhIUlxuXG5mdW5jdGlvbiBjcmVhdGVYSFIob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgb3B0aW9ucyA9IHsgdXJpOiBvcHRpb25zIH1cbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGNhbGxiYWNrID0gb25jZShjYWxsYmFjaylcblxuICAgIHZhciB4aHIgPSBvcHRpb25zLnhociB8fCBudWxsXG5cbiAgICBpZiAoIXhocikge1xuICAgICAgICBpZiAob3B0aW9ucy5jb3JzIHx8IG9wdGlvbnMudXNlWERSKSB7XG4gICAgICAgICAgICB4aHIgPSBuZXcgWERSKClcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB4aHIgPSBuZXcgWEhSKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB1cmkgPSB4aHIudXJsID0gb3B0aW9ucy51cmkgfHwgb3B0aW9ucy51cmxcbiAgICB2YXIgbWV0aG9kID0geGhyLm1ldGhvZCA9IG9wdGlvbnMubWV0aG9kIHx8IFwiR0VUXCJcbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keSB8fCBvcHRpb25zLmRhdGFcbiAgICB2YXIgaGVhZGVycyA9IHhoci5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9XG4gICAgdmFyIHN5bmMgPSAhIW9wdGlvbnMuc3luY1xuICAgIHZhciBpc0pzb24gPSBmYWxzZVxuICAgIHZhciBrZXlcbiAgICB2YXIgbG9hZCA9IG9wdGlvbnMucmVzcG9uc2UgPyBsb2FkUmVzcG9uc2UgOiBsb2FkWGhyXG5cbiAgICBpZiAoXCJqc29uXCIgaW4gb3B0aW9ucykge1xuICAgICAgICBpc0pzb24gPSB0cnVlXG4gICAgICAgIGhlYWRlcnNbXCJBY2NlcHRcIl0gPSBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICBpZiAobWV0aG9kICE9PSBcIkdFVFwiICYmIG1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcbiAgICAgICAgICAgIGhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuanNvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSByZWFkeXN0YXRlY2hhbmdlXG4gICAgeGhyLm9ubG9hZCA9IGxvYWRcbiAgICB4aHIub25lcnJvciA9IGVycm9yXG4gICAgLy8gSUU5IG11c3QgaGF2ZSBvbnByb2dyZXNzIGJlIHNldCB0byBhIHVuaXF1ZSBmdW5jdGlvbi5cbiAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gSUUgbXVzdCBkaWVcbiAgICB9XG4gICAgLy8gaGF0ZSBJRVxuICAgIHhoci5vbnRpbWVvdXQgPSBub29wXG4gICAgeGhyLm9wZW4obWV0aG9kLCB1cmksICFzeW5jKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9iYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAgaWYgKG9wdGlvbnMud2l0aENyZWRlbnRpYWxzIHx8IChvcHRpb25zLmNvcnMgJiYgb3B0aW9ucy53aXRoQ3JlZGVudGlhbHMgIT09IGZhbHNlKSkge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgIH1cblxuICAgIC8vIENhbm5vdCBzZXQgdGltZW91dCB3aXRoIHN5bmMgcmVxdWVzdFxuICAgIGlmICghc3luYykge1xuICAgICAgICB4aHIudGltZW91dCA9IFwidGltZW91dFwiIGluIG9wdGlvbnMgPyBvcHRpb25zLnRpbWVvdXQgOiA1MDAwXG4gICAgfVxuXG4gICAgaWYgKHhoci5zZXRSZXF1ZXN0SGVhZGVyKSB7XG4gICAgICAgIGZvcihrZXkgaW4gaGVhZGVycyl7XG4gICAgICAgICAgICBpZihoZWFkZXJzLmhhc093blByb3BlcnR5KGtleSkpe1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSGVhZGVycyBjYW5ub3QgYmUgc2V0IG9uIGFuIFhEb21haW5SZXF1ZXN0IG9iamVjdFwiKVxuICAgIH1cblxuICAgIGlmIChcInJlc3BvbnNlVHlwZVwiIGluIG9wdGlvbnMpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IG9wdGlvbnMucmVzcG9uc2VUeXBlXG4gICAgfVxuICAgIFxuICAgIGlmIChcImJlZm9yZVNlbmRcIiBpbiBvcHRpb25zICYmIFxuICAgICAgICB0eXBlb2Ygb3B0aW9ucy5iZWZvcmVTZW5kID09PSBcImZ1bmN0aW9uXCJcbiAgICApIHtcbiAgICAgICAgb3B0aW9ucy5iZWZvcmVTZW5kKHhocilcbiAgICB9XG5cbiAgICB4aHIuc2VuZChib2R5KVxuXG4gICAgcmV0dXJuIHhoclxuXG4gICAgZnVuY3Rpb24gcmVhZHlzdGF0ZWNoYW5nZSgpIHtcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICBsb2FkKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEJvZHkoKSB7XG4gICAgICAgIC8vIENocm9tZSB3aXRoIHJlcXVlc3RUeXBlPWJsb2IgdGhyb3dzIGVycm9ycyBhcnJvdW5kIHdoZW4gZXZlbiB0ZXN0aW5nIGFjY2VzcyB0byByZXNwb25zZVRleHRcbiAgICAgICAgdmFyIGJvZHkgPSBudWxsXG5cbiAgICAgICAgaWYgKHhoci5yZXNwb25zZSkge1xuICAgICAgICAgICAgYm9keSA9IHhoci5yZXNwb25zZVxuICAgICAgICB9IGVsc2UgaWYgKHhoci5yZXNwb25zZVR5cGUgPT09ICd0ZXh0JyB8fCAheGhyLnJlc3BvbnNlVHlwZSkge1xuICAgICAgICAgICAgYm9keSA9IHhoci5yZXNwb25zZVRleHQgfHwgeGhyLnJlc3BvbnNlWE1MXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNKc29uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJvZHlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTdGF0dXNDb2RlKCkge1xuICAgICAgICByZXR1cm4geGhyLnN0YXR1cyA9PT0gMTIyMyA/IDIwNCA6IHhoci5zdGF0dXNcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSdyZSBnZXR0aW5nIGEgbm9uZS1vayBzdGF0dXNDb2RlLCBidWlsZCAmIHJldHVybiBhbiBlcnJvclxuICAgIGZ1bmN0aW9uIGVycm9yRnJvbVN0YXR1c0NvZGUoc3RhdHVzKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG51bGxcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMCB8fCAoc3RhdHVzID49IDQwMCAmJiBzdGF0dXMgPCA2MDApKSB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9ICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIiA/IGJvZHkgOiBmYWxzZSkgfHxcbiAgICAgICAgICAgICAgICBtZXNzYWdlc1tTdHJpbmcoc3RhdHVzKS5jaGFyQXQoMCldXG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKVxuICAgICAgICAgICAgZXJyb3Iuc3RhdHVzQ29kZSA9IHN0YXR1c1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVycm9yXG4gICAgfVxuXG4gICAgLy8gd2lsbCBsb2FkIHRoZSBkYXRhICYgcHJvY2VzcyB0aGUgcmVzcG9uc2UgaW4gYSBzcGVjaWFsIHJlc3BvbnNlIG9iamVjdFxuICAgIGZ1bmN0aW9uIGxvYWRSZXNwb25zZSgpIHtcbiAgICAgICAgdmFyIHN0YXR1cyA9IGdldFN0YXR1c0NvZGUoKVxuICAgICAgICB2YXIgZXJyb3IgPSBlcnJvckZyb21TdGF0dXNDb2RlKHN0YXR1cylcbiAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgYm9keTogZ2V0Qm9keSgpLFxuICAgICAgICAgICAgc3RhdHVzQ29kZTogc3RhdHVzLFxuICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgICByYXc6IHhoclxuICAgICAgICB9XG4gICAgICAgIGlmKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMpeyAvL3JlbWVtYmVyIHhociBjYW4gaW4gZmFjdCBiZSBYRFIgZm9yIENPUlMgaW4gSUVcbiAgICAgICAgICAgIHJlc3BvbnNlLmhlYWRlcnMgPSBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHt9XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhlcnJvciwgcmVzcG9uc2UsIHJlc3BvbnNlLmJvZHkpXG4gICAgfVxuXG4gICAgLy8gd2lsbCBsb2FkIHRoZSBkYXRhIGFuZCBhZGQgc29tZSByZXNwb25zZSBwcm9wZXJ0aWVzIHRvIHRoZSBzb3VyY2UgeGhyXG4gICAgLy8gYW5kIHRoZW4gcmVzcG9uZCB3aXRoIHRoYXRcbiAgICBmdW5jdGlvbiBsb2FkWGhyKCkge1xuICAgICAgICB2YXIgc3RhdHVzID0gZ2V0U3RhdHVzQ29kZSgpXG4gICAgICAgIHZhciBlcnJvciA9IGVycm9yRnJvbVN0YXR1c0NvZGUoc3RhdHVzKVxuXG4gICAgICAgIHhoci5zdGF0dXMgPSB4aHIuc3RhdHVzQ29kZSA9IHN0YXR1c1xuICAgICAgICB4aHIuYm9keSA9IGdldEJvZHkoKVxuICAgICAgICB4aHIuaGVhZGVycyA9IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpXG5cbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIHhociwgeGhyLmJvZHkpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IoZXZ0KSB7XG4gICAgICAgIGNhbGxiYWNrKGV2dCwgeGhyKVxuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBub29wKCkge31cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbmlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpe1xuICAgIG1vZHVsZS5leHBvcnRzID0gc2VsZjtcbn0gZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7fTtcbn1cblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwibW9kdWxlLmV4cG9ydHMgPSBvbmNlXG5cbm9uY2UucHJvdG8gPSBvbmNlKGZ1bmN0aW9uICgpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEZ1bmN0aW9uLnByb3RvdHlwZSwgJ29uY2UnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBvbmNlKHRoaXMpXG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSlcbn0pXG5cbmZ1bmN0aW9uIG9uY2UgKGZuKSB7XG4gIHZhciBjYWxsZWQgPSBmYWxzZVxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmIChjYWxsZWQpIHJldHVyblxuICAgIGNhbGxlZCA9IHRydWVcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG59XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzLWZ1bmN0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBmb3JFYWNoXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gZm9yRWFjaChsaXN0LCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXNGdW5jdGlvbihpdGVyYXRvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgY29udGV4dCA9IHRoaXNcbiAgICB9XG4gICAgXG4gICAgaWYgKHRvU3RyaW5nLmNhbGwobGlzdCkgPT09ICdbb2JqZWN0IEFycmF5XScpXG4gICAgICAgIGZvckVhY2hBcnJheShsaXN0LCBpdGVyYXRvciwgY29udGV4dClcbiAgICBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ3N0cmluZycpXG4gICAgICAgIGZvckVhY2hTdHJpbmcobGlzdCwgaXRlcmF0b3IsIGNvbnRleHQpXG4gICAgZWxzZVxuICAgICAgICBmb3JFYWNoT2JqZWN0KGxpc3QsIGl0ZXJhdG9yLCBjb250ZXh0KVxufVxuXG5mdW5jdGlvbiBmb3JFYWNoQXJyYXkoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGFycmF5LCBpKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVtpXSwgaSwgYXJyYXkpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hTdHJpbmcoc3RyaW5nLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBzdHJpbmcubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgLy8gbm8gc3VjaCB0aGluZyBhcyBhIHNwYXJzZSBzdHJpbmcuXG4gICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgc3RyaW5nLmNoYXJBdChpKSwgaSwgc3RyaW5nKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZm9yRWFjaE9iamVjdChvYmplY3QsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgZm9yICh2YXIgayBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmplY3Rba10sIGssIG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaXNGdW5jdGlvblxuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24gKGZuKSB7XG4gIHZhciBzdHJpbmcgPSB0b1N0cmluZy5jYWxsKGZuKVxuICByZXR1cm4gc3RyaW5nID09PSAnW29iamVjdCBGdW5jdGlvbl0nIHx8XG4gICAgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiBzdHJpbmcgIT09ICdbb2JqZWN0IFJlZ0V4cF0nKSB8fFxuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAvLyBJRTggYW5kIGJlbG93XG4gICAgIChmbiA9PT0gd2luZG93LnNldFRpbWVvdXQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuYWxlcnQgfHxcbiAgICAgIGZuID09PSB3aW5kb3cuY29uZmlybSB8fFxuICAgICAgZm4gPT09IHdpbmRvdy5wcm9tcHQpKVxufTtcbiIsIlxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHJpbTtcblxuZnVuY3Rpb24gdHJpbShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKTtcbn1cblxuZXhwb3J0cy5sZWZ0ID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKi8sICcnKTtcbn07XG5cbmV4cG9ydHMucmlnaHQgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xccyokLywgJycpO1xufTtcbiIsInZhciB0cmltID0gcmVxdWlyZSgndHJpbScpXG4gICwgZm9yRWFjaCA9IHJlcXVpcmUoJ2Zvci1lYWNoJylcbiAgLCBpc0FycmF5ID0gZnVuY3Rpb24oYXJnKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChoZWFkZXJzKSB7XG4gIGlmICghaGVhZGVycylcbiAgICByZXR1cm4ge31cblxuICB2YXIgcmVzdWx0ID0ge31cblxuICBmb3JFYWNoKFxuICAgICAgdHJpbShoZWFkZXJzKS5zcGxpdCgnXFxuJylcbiAgICAsIGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gcm93LmluZGV4T2YoJzonKVxuICAgICAgICAgICwga2V5ID0gdHJpbShyb3cuc2xpY2UoMCwgaW5kZXgpKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgLCB2YWx1ZSA9IHRyaW0ocm93LnNsaWNlKGluZGV4ICsgMSkpXG5cbiAgICAgICAgaWYgKHR5cGVvZihyZXN1bHRba2V5XSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZVxuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkocmVzdWx0W2tleV0pKSB7XG4gICAgICAgICAgcmVzdWx0W2tleV0ucHVzaCh2YWx1ZSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRba2V5XSA9IFsgcmVzdWx0W2tleV0sIHZhbHVlIF1cbiAgICAgICAgfVxuICAgICAgfVxuICApXG5cbiAgcmV0dXJuIHJlc3VsdFxufSJdfQ==
