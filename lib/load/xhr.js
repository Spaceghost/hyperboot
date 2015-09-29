var xhr = require('xhr')
module.exports = function loader (href, cb) {
  xhr(href, function (err, res, body) {
    if (err) return cb(err)
    else cb(null, body)
  })
}
