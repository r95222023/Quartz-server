var fbUtil = require('../components/firebaseUtil/firebaseUtil.service'),
  util = require('../components/utils/util'),
  _ = require('lodash'),
  lzString = require('lz-string'),
  emitter = require('../components/emitter/emitter'),
  errorHandler = require('../components/errorHandler/errorHandler.service');

class SearchQueue {
  private esc: any;
  private options: any;
  requestRootRef: any;
  specsRef: any;
  responseRootRef: any;
  cacheRootRef: any;
  cleanupInterval: number;

  constructor(esc: any, options: any) {
    var _options = options || {};
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
    this._resetCache();
  }

  _asertValidSearch(props: any) {
    var res = true,
      _props = props || {};

    if (typeof _props.indexType === 'string') {
      var arr = _props.indexType.split(':');
      _props.index = arr[0];
      _props.type = arr[1];
    }

    if (!_props.index || !_props.type) {

      res = false;
      throw 'search request must be a valid object with index and type'
    }
    return res;
  }

  _onSearchComplete(data: any, error: any, response: any, requestRef: any, responseRef: any, resolve: any, reject: any) {
    if (error) {
      errorHandler(error,{code:'ELASTICSEARCH_SEARCH_ERROR'}, reject);
    } else {
      var _response = {
        // request: data,
        compressed: lzString.compressToUTF16(JSON.stringify({result: response.hits})),
        editTime: fbUtil.ServerValue.TIMESTAMP,
        usage: {
          // created: fbUtil.ServerValue.TIMESTAMP,
          times: 1
        }
      };
      responseRef.update(_response, (error: any)=> {
        if (error) {
          errorHandler(error,{code:'FIREBASE_DATABASE_UPDATE_ERROR'}, reject);
        }
        if (!data.cache) responseRef.onDisconnect().remove();
        requestRef.onDisconnect().remove();
        setTimeout(()=> {
          if (!data.cache) {
            responseRef.onDisconnect().cancel();
            responseRef.remove();
          }
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

        var taskRef = this.requestRootRef,
          id = data['_id'],
          index = data['indexType'].split(':')[0],
          type = data['indexType'].split(':')[1],
          requestRef = taskRef.child(id),
          responseRef = data.responseUrl ? fbUtil.ref(data.responseUrl) : (data.cache===true? this.cacheRootRef.child(index+type).child(id):this.responseRootRef.child(id));
        data.body = data.body || {
            "query": {
              "match_all": {}
            }
          };
        var rectifiedData = this._rectifyData(data, {
          arrayLimit: data.size,
          keyFilter: function (key: string) {
            return _.isString(key) ? key.replace('_dot_', '.') : key
          }
        });
        this.esc.search(rectifiedData, (error: any, response: any)=> {
          this._onSearchComplete(data, error, response, requestRef, responseRef, resolve, reject)
        });
      }
    });
  }

  _resetCache() {
    var self = this;

    function reset(opt: any) {
      if ((typeof opt.index === 'string') && (typeof opt.type === 'string')) self.cacheRootRef.child(opt.index + opt.type).remove();
    }

    emitter.on('index_changed', util.debounce(reset, 10000));
  }

  _isJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  _rectifyData(data: any, option: any) {
    var _option = option || {},
      arrayLimit = _option.arrayLimit || 100;

    function toPosInt(key: string) {
      var n = Number(key);
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
      var arr: any[] = [],
        obj: any = {},
        isArray = true;
      _.forEach(data, (value: any, key: any)=> {
        var n = toPosInt(key);
        if (n !== false && n < arrayLimit) {
          arr[key] = _.isObject(value) ? iterate(value) : value;
          return;
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

module.exports = function (esc: any, options: any) {
  return new SearchQueue(esc, options);
};
