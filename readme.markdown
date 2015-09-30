# hyperboot

versioned offline webapp bootloader

Single page applications, where appropriate, have many usability benefits: once
you give someone a URL they can immediately load your app and start using it.
Native and desktop applications require more setup but once you've
installed an app it doesn't change or disappear without warning.

`hyperboot` gives your users the benefits of explicit, immutable versioning with
control over upgrades using the
[html-version-spec](https://github.com/substack/html-version-spec)
while preserving the simplicity of passing around a URL.

# quick start

Install hyperboot and generate a starter html file:

```
$ npm install -g hyperboot
$ hyperboot init > index.html
```

Edit `index.html` to your liking, then:

```
$ hyperboot commit index.html
1.0.0 3503106b1b989b0407ede086cb2223d5
```

We've now committed version 1.0.0.

To put your creation online, serve up the hidden `.hyperboot` directory:

```
$ ecstatic -p 8000 .hyperboot/ \
  -H 'Access-Control-Allow-Origin: *'
  -H 'Access-Control-Allow-Headers: If-Modified-Since, If-None-Match'
```

The `Access-Control-*` (CORS) headers are necessary for browser loaders to load
your application across domains.

Now you can view your web app on `http://localhost:8000`. This version of your
app is usable on its own and hyperboot loaders will be able to see all of your
published versions.

## publish a new version

To publish a new version, we can run `hyperboot commit` again after editing the
meta version tag in the html:

``` html
<meta name="version" content="1.0.1">
```

Now to commit version 1.0.1:

```
$ hyperboot commit index.html 
1.0.1 446c5dfa3d7dbd93f181506bdbef9369
```

## replicate

Elsewhere, we can replicate the webapp and all of its version history with the
`hyperboot clone` command:

```
$ hyperboot clone http://localhost:8000
1.0.0 3503106b1b989b0407ede086cb2223d5
1.0.1 446c5dfa3d7dbd93f181506bdbef9369
```

All of the new versions are printed to stdout. If we run the command again, we
get no output because there are no new versions available:

```
$ hyperboot clone http://localhost:8000
```

# problems

Explicit versioning and upgrades addresses many problems that users currently
experience with webapps:

* an app disappears, leaving users with no recourse
* an app changes to have user-hostile features over time
* underlying infrastructure changes or vanishes
* an app is compromised silently with no mechanism for auditing

Compromising webapps by criminal, spy agency, or court order will become an
increasingly important problem to solve as browsers gain crypto primitives.
Malicious code could be silently inserted into any update.

# usage

```
hyperboot init

  Print a starter html file to STDOUT.

hyperboot commit FILE

  Stage the version of FILE locally.

hyperboot clone URL

  Clone the versions starting from URL into `.hyperboot`.

hyperboot versions

  List local versions from `.hyperboot`.
  With -v, print truncated hashes in another column.

hyperboot show VERSION
hyperboot show HASH

  Print the contents of the html at VERSION or HASH.
  With --full, print the content with included meta data.

```

# api

The `hyperboot` API can be used to build loaders for node and the browser.

``` js
var hyperboot = require('hyperboot')
```

## var boot = hyperboot(db)

Create a hyperboot instance `boot` from a levelup handle `db`.

## boot.versions(cb)

Load all the known versions as `cb(err, versions)`.

The format of each version object is described in the `'version'` event below.

## var walk = boot.load(href, cb)

Walk the hyperboot data at `href` recursively looking for new versions.
`cb(err, versions)` fires with an array of the versions found.

`walk` is an event emitter that emits `'version'` events for each new available
webapp version found under `href`.

The format of each version object is described in the `'version'` event below.

## boot.on('version', function (version, html) {})

Each time a new webapp version is loaded, the `'version'` event fires with an
`html` buffer payload and a version object:

* `version.version` - the semver version string
* `version.hrefs` - the known locations of the document as an array of URLs
* `version.predecessor` - the previous version
* `version.versions` - any extra versions known by this document
* `version.hash` - the sha512 hex string of the content

The version object augments the return value from
[html-version](https://npmjs.com/package/html-version)`.parse()`.

## boot.get(version, cb)
## boot.get(hash, cb)

Load the html payload by a sha512 hash `hash` or a semver version string
`version` into `cb(err, html)`.

## boot.remove(version, cb)

Remove a version by its semver `version` string.

## boot.clear(cb)

Remove all known versions.

# install

With [npm](https://npmjs.org) do:

```
npm install -g hyperboot
```

# license

MIT
