var hyperboot = require('../')
var boot = hyperboot()
boot.on('version', addVersion)
boot.versions(function (err, versions) {
  versions.forEach(addVersion)
})

var elems = {
  versions: document.querySelector('#versions'),
  version: document.querySelector('[template=version]'),
  versionBox: document.querySelector('.versions-outer'),
  form: document.querySelector('form#load')
}
elems.form.addEventListener('submit', function (ev) {
  ev.preventDefault()
  boot.load(this.elements.url.value, function (err) {
    if (err) console.error(err)
  })
})

function addVersion (v) {
  var elem = elems.version.cloneNode(true)
  elem.removeAttribute('template')
  var link = elem.querySelector('*[data-key]')
  link.setAttribute('href', v.hrefs[0])
  link.textContent = v.version
  elems.versions.appendChild(elem)
  elems.versionBox.classList.remove('hide')
}
