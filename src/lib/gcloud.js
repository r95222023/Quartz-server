var config = require('../config'),
    FBCONFIG = config.FBCONFIG,
    gcloud=require('gcloud'); // The google cloud nodejs SDK
const gcs = gcloud.storage({
    projectId: FBCONFIG.projectId,
    keyFilename: FBCONFIG.serviceAccount
});
const bucket = gcs.bucket('gs://project-3415547818359859659.appspot.com');