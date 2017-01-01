import fbUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import util = require('../../components/utils/util');
import lzString = require('../../components/encoding/lzString');
// import emitter = require('../../components/emitter/emitter');
import errorHandler = require('../../components/errorHandler/errorHandler.service');
import queryBuilder = require('../../components/elasticsearchClient/queryBuilder');

import * as _ from 'lodash';

class SearchQueue {
  private esc: any;
  private options: any;
  requestRootRef: any;
  specsRef: any;
  responseRootRef: any;
  cacheRootRef: any;
  cleanupInterval: number;

  constructor(esc: any, options: any) {
    let _options = options || {};
    _options.numWorkers = _options.numWorkers || 10;
    _options.sanitize = false;
    _options.suppressStack = _options.suppressStack || true;

    this.esc = esc;
    this.options = _options;
    this.requestRootRef = fbUtil.ref('query-request');
    this.specsRef = fbUtil.ref('query-specs');
    this.responseRootRef = fbUtil.ref('query-response');
    this.cleanupInterval = _options.cleanupInterval || 10000;
    this.cacheRootRef = typeof _options.cacheRefUrl === 'string' ? fbUtil.ref(_options.cacheRefUrl) : fbUtil.ref('query-cache');
    this._process();
  }

  _asertValidSearch(searchData: any) {
    let res = true;
    if (!searchData.siteName || !searchData.type) {
      res = false;
      throw 'search request must be a valid object with siteName and type'
    }
    return res;
  }

  _onSearchComplete(data: any, error: any, response: any, requestRef: any, responseRef: any, resolve: any, reject: any) {
    console.log(response);
    if (error) {
      errorHandler(error,{code:'ELASTICSEARCH_SEARCH_ERROR'}, reject);
    } else {
      let _response = {
        // request: data,
        compressed: lzString.compress({result: response.hits}),
        editTime: (new Date()).getTime()/*,
        usage: {
          // created: fbUtil.ServerValue.TIMESTAMP,
          times: 1
        }*/
      };
      responseRef.update(_response, (error: any)=> {
        if (error) {
          errorHandler(error,{code:'FIREBASE_DATABASE_UPDATE_ERROR'}, reject);
        }
        // if (!data.cache) responseRef.onDisconnect().remove();
        requestRef.onDisconnect().remove();
        setTimeout(()=> {
          // if (!data.cache) {
          //   responseRef.remove();
          // }
          requestRef.onDisconnect().cancel();
          resolve();
        }, this.cleanupInterval)
      });
    }
  };

  _process() {
    fbUtil.queue({
      tasksRef: this.requestRootRef,
      specsRef: this.specsRef
    }, this.options, (data: any, progress: any, resolve: any, reject: any)=> {
      if (this._asertValidSearch(data)) {
        let taskRef = this.requestRootRef,
          id = data['_id'],
          siteName = data.siteName,
          type = data.type,
          requestRef = taskRef.child(id),
          responseRef = this.cacheRootRef.child(siteName+type).child(id);
        this.esc.search(queryBuilder.buildQuery(data), (error: any, response: any)=> {
          this._onSearchComplete(data, error, response, requestRef, responseRef, resolve, reject)
        });
      }
    });
  }

  // _resetCache() {
  //   let self = this;
  //
  //   function reset(opt: any) {
  //     if ((typeof opt.index === 'string') && (typeof opt.type === 'string')) self.cacheRootRef.child(opt.index + opt.type).remove();
  //   }
  //
  //   emitter.on('index_changed', util.debounce(reset, 10000));
  // }

  _isJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  _rectifyData(data: any, option: any) {
    let _option = option || {},
      arrayLimit = _option.arrayLimit || 100;

    function toPosInt(key: string) {
      let n = Number(key);
      return n % 1 === 0 && n > -1 ? n : false;
    }

    function keyFilter(key: string) {
      if (_.isFunction(_option.keyFilter)) {
        return _option.keyFilter(key);
      } else {
        return key;
      }
    }

    function iterate(data: any) {
      let arr: any[] = [],
        obj: any = {},
        isArray = true;
      _.forEach(data, (value: any, key: any)=> {
        let n = toPosInt(key);
        if (n !== false && n < arrayLimit) {
          arr[key] = _.isObject(value) ? iterate(value) : value;
          return true;
        } else {
          isArray = false;
          return false;
        }
      });
      if (isArray === false) _.forEach(data, function (value: any, key: string) {
        key = keyFilter(key);
        obj[key] = _.isObject(value) ? iterate(value) : value;
      });
      return isArray ? arr : obj;
    }

    return iterate(data);
  }
}

export = function (esc: any, options: any) {
  return new SearchQueue(esc, options);
};
