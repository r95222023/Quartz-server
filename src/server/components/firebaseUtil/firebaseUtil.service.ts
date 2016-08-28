var firebase = require("firebase"),
  Queue = require('firebase-queue'),
  q = require('q'),
  _ = require('lodash'),
  config = require('../../config/firebase.config');
///
firebase.initializeApp(config);

function parseRefUrl(refUrl: string, params: any) {
  let res: string;
  res = refUrl;
  if (config.paths[refUrl]) {
    res = config.paths[refUrl];
    if (typeof params === 'object') {
      _.forEach(params.params||params, function (val: string, key: string) {
        res.replace(':' + key, val);
      });
    }
  }
  return res
}

function formalizeKey(key: string) {
  var res = key, replace = [[/\./g, '^%0'], [/#/g, '^%1'], [/\$/g, '^%2'], [/\[/g, '^%3'], [/\]/g, '^%4']];
  _.forEach(replace, function (val: any[]) {
    res = res.replace(val[0], val[1]);
  });
  // ".", "#", "$", "/", "[", or "]"
  return res;
}

function formalizeData(obj: Object) {
  let resultObj: any = {};
  _.forEach(obj, function (val: any, key: string) {
    resultObj[formalizeKey(key+'')] = (typeof val === 'object') ? formalizeData(val) : val;
  });
  return resultObj
}

function queryRef(refUrl: string, options: any) {
  var opt = options || {},
    ref: any;
  if (refUrl.search('://') !== -1) {
    ref = firebase.database().refFromURL(parseRefUrl(refUrl, {}));
  } else {
    ref = firebase.database().ref(parseRefUrl(refUrl, opt));
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

function batchUpload(uploadList: Object) {
  var defer = q.defer(),
    data: any = {};
  _.forOwn(uploadList, function (val: any, key: string) {
    data[parseRefUrl(key.split('#')[0], val.params)] = val.data;
  });
  return defer.promise
}

function queue(ref: any, options: any, callback: any) {
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
  formalizeKey: formalizeKey,
  formalizeData: formalizeData,
  parseRefUrl: parseRefUrl,
  batchUpload: batchUpload,
  queue: queue
};
