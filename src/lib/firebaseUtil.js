var firebase = require("firebase"),
    Queue = require('firebase-queue'),
    q = require('q'),
    _ = require('lodash'),
    config = require('../config');
///
firebase.initializeApp(config.FBCONFIG);

function parseRefUrl(refUrl) {
    //TODO
    return refUrl
}

function formalizeData(data) {
    function formalizeKey(key) {
        var find = [/\./g, /#/g, /\//g, /\[/g, /\]/g];
        for (var i = 0; i < find.length; i++) {
            key = key.replace(find[i], '-');
        }
        return key;
    }

    function iterate(obj) {
        var resultObj = {};
        for (var key in obj) {
            resultObj[formalizeKey(key)] = (typeof obj[key] === 'object') ? iterate(obj[key]) : obj[key];
        }
        return resultObj
    }

    return iterate(data);
}

function queryRef(refUrl, options) {
    var opt = options || {},
        ref = firebase.database().refFromURL(parseRefUrl(refUrl));
    if (opt.orderBy) {
        var orderBy = 'orderBy' + opt.orderBy.split(':')[0];
        if (orderBy === 'orderByChild') {
            ref = ref[orderBy](opt.orderBy.split(':')[1]); //ex {orderBy:'Child:name'}
        } else {
            ref = ref[orderBy]();
        }

    } else {
        return ref
    }

    if (opt.startAt) {
        ref = ref['startAt'](opt.startAt);
    }
    if (opt.endAt) {
        ref = ref['endAt'](opt.endAt);
    }
    if (opt.equalTo) {
        ref = ref['equalTo'](opt.equalTo);
    }
    if (opt.limitToFirst) {
        ref = ref['limitToFirst'](opt.limitToFirst);
    }
    if (opt.limitToLast) {
        ref = ref['limitToLast'](opt.limitToLast);
    }
    return ref;
}

//function watch(watchList, generalOpt) {
//    var ref = {},
//        gOpt = generalOpt || {};
//
//    function onComplete(key) {
//        return function (snap, prevKey) {
//            if (typeof watchList[key].onComplete === 'function') {
//                watchList[key].onComplete.apply(null, [snap, prevKey])
//            }
//        }
//    }
//
//    for (var key in watchList) {
//        if (watchList.hasOwnProperty(key)) {
//            watchList[key].opt = watchList[key].opt || {};
//            ref[key] = queryRef(watchList[key].refUrl);
//            queryRef.on(watchList[key].opt.type || gOpt.type || 'value', onComplete(key))
//        }
//    }
//    return ref
//}


function replaceParams(objOrStr, params) {
    for (var key in params) {
        objOrStr.replace(key, params[key])
    }
    //TODO: object version
}


function getRefUrl(rawRefUrl, callback) {
    var def = q.defer(),
        matches = rawRefUrl.match(/\(([^)]+)\)/) || [],  // aaa(abc)aa(a)jfklj will give [abc, a]
        refUrl = parseRefUrl(rawRefUrl),
        defers = [],
        promises = [];

    def.promise.nodeify(callback);
    if (!matches[1]) {
        def.resolve(refUrl);
        return def.promise
    }

    function onComplete(i) {
        return function (snap) {
            refUrl.replace('(' + matches[i] + ')', snap.val());
            waitUntil.resolve();
        }
    }

    for (var i = 1; i < matches.length; i++) {
        queryRef(matches[i]).once('value', onComplete(i), function (error) {
            def.reject(error)
        });
    }


    return def.promise
}

function batchUpload(uploadList) {
    var promises = {},
        defers = {};
    _.forOwn(uploadList, function (upload, key) {
        defers[key] = q.defer();
        promises[key] = defers[key].promise;
        queryRef(upload.refUrl).update(upload.value, function (error) {
            if (error) {
                defers[key].reject(error);
            } else {
                defers[key].resolve();
            }
        });
    });
    return q.all(promises)
}

function queue(ref, options, callback) {
    if (!callback) {
        return new Queue(ref, options);
    } else {
        return new Queue(ref, options, callback);
    }
}


module.exports = {
    ref: queryRef,
    auth: firebase.auth,
    database: firebase.database,
    storage: firebase.storage,
    ServerValue: firebase.database.ServerValue,
    formalizeData: formalizeData,
    queue: queue
};
