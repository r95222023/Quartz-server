import * as _ from 'lodash';
// import config = require('../../configs/firebase.config'); //see https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/Modules.html
let config= require('../../configs/firebase.config');
let admin= require('firebase-admin');
let Queue = require('firebase-queue');
///
admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccount),
  databaseURL: config.databaseURL
});

function parseRefUrl(refUrl: string, option?: any) {
  let res = refUrl,
    opt = typeof option === 'object' ? option.params || option : {},
    params = Object.assign({}, opt),
    refUrlAndParams = refUrl.split('?'),
    stringParams = (refUrlAndParams[1] || '').split('&');
  if (stringParams[0] !== '') {
    stringParams.forEach(function (val) {
      let hash = val.split('=');
      params[hash[0]] = hash[1];
    })
  }
  if (config.paths[refUrlAndParams[0]]) {
    res = config.paths[refUrlAndParams[0]];

    for (let key in params) {
      res = res.replace(':' + key, params[key + '']);
    }
  }

  return res
}

let replace = [[/\./g, '^%0'], [/#/g, '^%1'], [/\$/g, '^%2'], [/\[/g, '^%3'], [/\]/g, '^%4']];
function formalizeKey(key: string) {
  let res = key;
  _.forEach(replace, function (val: any[]) {
    res = res.replace(val[0], val[1]);
  });
  // ".", "#", "$", "/", "[", or "]"
  return res;
}
function deFormalizeKey(key: string) {
  let res = key;
  _.forEach(replace, function (val: any[]) {
    res = res.replace(val[1], val[0]);
  });
  return res;
}

function formalizeData(obj: Object) {
  let resultObj: any = {};
  _.forEach(obj, function (val: any, key: string) {
    resultObj[formalizeKey(key+'')] = (typeof val === 'object') ? formalizeData(val) : val;
  });
  return resultObj
}

function queryRef(refUrl: string, options?: any) {
  let opt:any = options || {},
    ref:any, database = admin.database();

  if (!refUrl) {
    return database.ref().root;
  } else if (refUrl.search('//') !== -1) {
    ref = database.refFromURL(parseRefUrl(refUrl));
  } else {
    ref = database.ref(parseRefUrl(refUrl, opt));
  }
  if (opt.orderBy) {
    let orderBy = 'orderBy' + opt.orderBy.split(':')[0];
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


function queue(ref: any, options: any, callback: any) {
  if (!callback) {
    return new Queue(ref, options);
  } else {
    return new Queue(ref, options, callback);
  }
}


export = {
  ref: queryRef,
  auth: admin.auth,
  database: admin.database,
  ServerValue: admin.database.ServerValue,
  formalizeKey: formalizeKey,
  deFormalizeKey:deFormalizeKey,
  formalizeData: formalizeData,
  parseRefUrl: parseRefUrl,
  queue: queue
};
