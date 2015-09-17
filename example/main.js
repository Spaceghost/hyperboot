var hyperboot = require('../')
var boot = hyperboot()
boot.on('version', addVersion)
boot.versions(function (err, versions) {
  versions.forEach(addVersion)
})

var elems = {
  versions: document.querySelector('#versions'),
  version: document.querySelector('[template=version]'),
  form: document.querySelector('form#load')
}
elems.form.addEventListener('submit', function (ev) {
  ev.preventDefault()
  boot.load(this.elements.url.value, function (err) {
    if (err) console.error(err)
  })
})

function addVersion (v) {
  var elem = elems.version.cloneNode()
  elem.removeAttribute('template')
  var link = elem.querySelector('[data-key]')
  link.setAttribute('href', '/version/' + v.version)
  elems.versions.appendChild(elem)
}
