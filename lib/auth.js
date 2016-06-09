var q = require('q'),
    config = require('../config'),
    firebaseUtil = require('./firebaseUtil'),
    errorHandler = require('./errorHandler');

var firebaseToken = config.FIREBASE_SECRETE,
    def = q.defer();

function authOnComplete(authData) {
    console.log('Log in with custom token: ' + firebaseToken);
    console.log('Authenticated');
    def.resolve(authData)
}

function auth() {
    console.log(firebaseUtil.auth())
    firebaseUtil.auth().signInWithCustomToken(firebaseToken).then(authOnComplete).catch(function(error){
        errorHandler(error);
        def.reject(error);
    });
    return def.promise
}

//auth();

module.exports = auth; // this will return an auth promise