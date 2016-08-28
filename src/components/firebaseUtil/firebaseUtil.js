var firebase = require("firebase"),
    Queue = require('firebase-queue'),
    q = require('q'),
    _ = require('lodash'),
    config = require('../../config/firebaseUtil.config');
///
firebase.initializeApp(config);

function parseRefUrl(refUrl, params) {
    var res;

    if (typeof  refUrl === 'string') {
        res = refUrl;
    } else if (typeof params === 'object' && config.paths[refUrl]) {
        res = config.paths[refUrl.type];
        if (typeof params === 'object') {
            _.forEach(refUrl.params, function (val, key) {
                res.replace('${' + key + '}', val);
            });
        }
    }
    return res
}

function formalizeKey(key) {
    var res = key, replace = [[/\./g, '^%0'], [/#/g, '^%1'], [/\$/g, '^%2'], [/\[/g, '^%3'], [/\]/g, '^%4']];
    _.forEach(replace, function (val) {
        res = res.replace(val[0], val[1]);
    });
    // ".", "#", "$", "/", "[", or "]"
    return res;
}

function formalizeData(obj) {
    var resultObj = {};
    _.forEach(obj, function (val, key) {
        resultObj[formalizeKey(key)] = (typeof val === 'object') ? formalizeData(val) : val;
    });
    return resultObj
}

function queryRef(refUrl, options) {
    var opt = options || {},
        ref;
    if (refUrl.search('://') !== -1) {
        ref = firebase.database().refFromURL(parseRefUrl(refUrl));
    } else {
        ref = firebase.database().ref(parseRefUrl(refUrl));
    }
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
//
// function replaceParams(objOrStr, params) {
//     for (var key in params) {
//         objOrStr.replace(key, params[key])
//     }
//     //TODO: object version
// }


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
    var defer = q.defer(),
        data = {};
    _.forOwn(uploadList, function (val, key) {
        data[parseRefUrl(key.split('#')[0], val.params)] = val.data;
    });
    return defer.promise
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
    parseRefUrl: parseRefUrl,
    batchUpload: batchUpload,
    queue: queue
};
