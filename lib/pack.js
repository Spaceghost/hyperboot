var lex = require('lexicographic-integer')

exports.pack = function (ver) {
  var parts = ver.split('-')[0].split('.')
  return lex.pack(parts[0], 'hex')
    + '.' + lex.pack(parts[1], 'hex')
    + '.' + lex.pack(parts[2], 'hex')
    + ver.replace(/^\d+\.\d+\.\d+/, '')
}

exports.unpack = function (ver) {
  var parts = ver.split('-')[0].split('.')
  return lex.unpack(parts[0])
    + '.' + lex.unpack(parts[1])
    + '.' + lex.unpack(parts[2])
    + ver.replace(/^[^-]*/, '')
}
