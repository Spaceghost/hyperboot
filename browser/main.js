var xhr = require('xhr');

xhr('versions.json', function (err, res, body) {
    var versions = JSON.parse(body);
    console.log(versions);
});
