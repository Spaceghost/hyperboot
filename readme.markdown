# htmlver

webapp versioning for end users

Single page applications, where appropriate, have many usability benefits: you
can just give someone a URL and they can immediately start using the
application. Native and desktop applications require more setup but once you've
installed an app it doesn't change or disappear without warning.

`htmlver` gives your users the benefits of explicit, immutable versioning with
control over upgrades while preserving the simplicity of passing around a URL.
Plus, offline works by default!

# problems

Explicit versioning and upgrades addresses many problems that users currently
experience with webapps:

* an app disappears, leaving users with no recourse
* an app changes to have user-hostile features over time
* underlying infrastructure changes or vanishes
* an app is compromised silently with no mechanism for auditing

Compromising apps by criminal, spy agency, or court order will become an
increasingly important problem to solve as browsers gain crypto primitives.
Malicious code could be silently inserted into any update.

htmlver solves some of these problems by using immutable hashes and control over
upgrades, but a more complete solution might also involve:

* use peer to peer connections (webrtc, webtorrent, etc) as much as possible
* document and version the external protocols and provide a mechanism to swap
out external endpoints
* let users volunteer server infrastructure with open protocols and service
implementations, like seeding content on bittorrent

# getting started

For a more complete example, look at the
[htmlver-example-app repository](https://github.com/htmlver-example-app).

# usage

```
htmlver release HTMLFILE { -m MESSAGE, -v VERSION }

  Create a release from HTMLFILE, a self-contained html payload.
  All of HTMLFILE's assets should be inlined.
  
  Optionally, set a MESSAGE and VERSION for the release. These will be visible
  to the user along with the hash of the release.

htmlver server { -p PORT }

  Start an http server for the app.

htmlver list

  Show the available releases.

```

# todo

* auditing tools

# in closing

The default mechanics of the web are highly skewed toward service providers and
away from users. To correct this imbalance, we developers should irrevocably
limit our own ability to exert control. A manifesto means nothing without a
mechanism.
