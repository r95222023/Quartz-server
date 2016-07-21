var config = require('../config'),
    FBCONFIG = config.FBCONFIG,
    gcloud=require('gcloud'); // The google cloud nodejs SDK
const gcs = gcloud.storage({
    projectId: FBCONFIG.projectId,
    keyFilename: FBCONFIG.serviceAccount
});
const bucket = gcs.bucket('project-3415547818359859659.appspot.com');

bucket.upload('./src/config.js', function(err, file) {
    if (!err) {
        // "zebra.jpg" is now in your bucket.
    }
    console.log(err);
    console.log(file)
});

module.exports = bucket;