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
  form: document.querySelector('form#load'),
  frame: document.querySelector('#frame')
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
  var href = v.hrefs[0]
  link.setAttribute('href', href)
  link.textContent = v.version
  link.addEventListener('click', function (ev) {
    ev.preventDefault()
    showApp(href)
  })
  elems.versions.appendChild(elem)
  elems.versionBox.classList.remove('hide')
}

var iframe
function showApp (href) {
  if (iframe) iframe.parentNode.removeChild(iframe)
  iframe = document.createElement('iframe')
  iframe.setAttribute('src', href)
  elems.frame.appendChild(iframe)
}
