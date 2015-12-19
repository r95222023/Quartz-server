var q = require('q'),
    config = require('../config'),
    firebaseUtil = require('./firebaseUtil'),
    errorHandler = require('./errorHandler');

var mainRefUrl = config.FBURL,
    firebaseToken = config.FIREBASE_SECRETE,
    def = q.defer();

function authOnComplete(error, authData) {
    if (error) {
        errorHandler(error);
        def.reject(error)
    } else {
        console.log('Log in with custom token: '+firebaseToken);
        console.log('Authenticated');
        def.resolve(authData)
    }
}

function auth(){
    firebaseUtil.ref(mainRefUrl).authWithCustomToken(firebaseToken, authOnComplete);
    return def.promise
}

//auth();

module.exports = auth; // this will return an auth promise