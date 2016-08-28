var fbUtil = require('../components/firebaseUtil/firebaseUtil.service'),
  util = require('../components/utils/util'),
  _ = require('lodash'),
  lzString = require('lz-string'),
  emitter = require('../components/emitter/emitter');


function SearchQueue(esc, options) {
  var _options = options || {};
  _options.numWorkers = _options.numWorkers || 10;
  _options.sanitize = false;
  _options.suppressStack = _options.suppressStack || true;

  this.esc = esc;
  this.options = _options;
  this.requestRef = fbUtil.ref('query-request');
  this.specsRef = fbUtil.ref('query-specs');
  this.responseRef = fbUtil.ref('query-response');
  this.cleanupInterval = _options.cleanupInterval || 10000;
  this.cacheRef = typeof _options.cacheRefUrl === 'string' ? fbUtil.ref(_options.cacheRefUrl) : fbUtil.ref('query-cache');
  this._process();
  this._resetCache();
}


SearchQueue.prototype = {
  _asertValidSearch: function (props) {
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
  },
  _process: function () {
    var self = this;
    var queue = fbUtil.queue({
      tasksRef: this.requestRef,
      specsRef: this.specsRef
    }, self.options, function (data, progress, resolve, reject) {
      if (self._asertValidSearch(data)) {

        var taskRef = self.requestRef,
          id = data['_id'],
          requestRef = taskRef.child(id),
          responseRef = data.responseUrl ? fbUtil.ref(data.responseUrl) : self.responseRef.child(id);
        data.body = data.body || {
            "query": {
              "match_all": {}
            }
          };
        var rectifiedData = self._rectifyData(data, {
          arrayLimit: data.size,
          keyFilter: function (key) {
            return _.isString(key) ? key.replace('_dot_', '.') : key
          }
        });
        self.esc.search(rectifiedData, onSearchComplete);
      }
      function onSearchComplete(error, response) {
        if (error) {
          reject(error);
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
          responseRef
            .update(_response, function (err) {
              if (err) reject(err);
              if (!data.cache) responseRef.onDisconnect().remove();
              requestRef.onDisconnect().remove();
              setTimeout(function () {
                if (!data.cache) {
                  responseRef.onDisconnect().cancel();
                  responseRef.remove();
                }
                requestRef.onDisconnect().cancel();
                resolve();
              }, self.cleanupInterval)
            });
        }
      }
    });
  },
  _resetCache: function () {
    var self = this;

    function onSearchComplete(responseRef) {
      return function (error, response) {
        if (error) {
          emitter.emit('error', error);
        } else {
          var result = response.hits;
          result.usage = {
            times: 1,
            last: fbUtil.ServerValue.TIMESTAMP
          };
          responseRef
            .set(result, function (err) {
              if (err) emitter.emit('error', error);
            });
        }
      }
    }

    function reset(opt) {
      if ((typeof opt.index === 'string') && (typeof opt.type === 'string')) self.cacheRef.child(opt.index + opt.type).remove();
    }

    emitter.on('index_changed', util.debounce(reset, 10000));
  },
  _isJson: function (str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  },
  _rectifyData: function (data, option) {
    var _option = option || {},
      arrayLimit = _option.arrayLimit || 100;

    function toPosInt(key) {
      var n = Number(key);
      return n % 1 === 0 && n > -1 ? n : false;
    }

    function keyFilter(key) {
      if (_.isFunction(_option.keyFilter)) {
        return _option.keyFilter(key);
      } else {
        return key;
      }
    }

    function iterate(data) {
      var arr = [],
        obj = {},
        isArray = true;
      _.forEach(data, function (value, key) {
        var n = toPosInt(key);
        if (n !== false && n < arrayLimit) {
          arr[key] = _.isObject(value) ? iterate(value) : value;
        } else {
          isArray = false;
          return false;
        }
      });
      if (isArray === false) _.forEach(data, function (value, key) {
        key = keyFilter(key);
        obj[key] = _.isObject(value) ? iterate(value) : value;
      });
      return isArray ? arr : obj;
    }

    return iterate(data);
  }
};

module.exports = function (esc, options) {
  return new SearchQueue(esc, options);
};
