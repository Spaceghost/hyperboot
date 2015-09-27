var cheerio = require('cheerio')

module.exports = function (body) {
  var sel = cheerio.load(body.toString())
  sel('link[rel="version"]').each(remove)
  sel('link[rel="predecessor-version"]').each(remove)
  return sel.html()

  function remove (i, el) {
    if (el.prev && el.prev.type === 'text'
    && /^\s*\n\s*$/.test(el.prev.data)) {
      sel(el.prev).remove()
    }
    sel(el).remove()
  }
}
