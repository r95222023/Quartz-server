var firebaseUtil = require('../lib/firebaseUtil'),
    http = require('http'),
    q = require('q');


module.exports = function (fbUrl, tasksRefPath, options) {
    var rootRef = firebaseUtil.ref(fbUrl);
    var queue = firebaseUtil.queue(rootRef, {tasksRefPath: tasksRefPath}, function (data, progress, resolve, reject) {

    })
};


