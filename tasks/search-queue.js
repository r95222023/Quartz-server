var config = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util');


function SearchQueue(esc, rootRefUrl, queryRefPath, options) {
    options = options || {};
    this.esc = esc;
    this.rootRef = firebaseUtil.ref(rootRefUrl) || firebaseUtil.ref(config.FBURL);
    this.tasksRefPath = queryRefPath + '/request';
    this.responseRefPath = queryRefPath+'/response';
    this.cleanupInterval = options.cleanupInterval || 10000;
    this.cacheRef = typeof options.cacheRefUrl === 'string' ? firebaseUtil.ref(options.cacheRefUrl) : this.rootRef.child(queryRefPath + '/cache');

    this._process();
    this._syncCache();
}


SearchQueue.prototype = {
    _asertValidSearch: function (props) {
        var res = true;
        if (typeof(props) !== 'object' || !props.index || !props.body) {
            res = false;
            throw 'search request must be a valid object with index and body'
        }
        return res;
    },
    _process: function () {
        var self = this;
        var queue = firebaseUtil.queue(this.rootRef, {tasksRefPath: this.tasksRefPath}, function (data, progress, resolve, reject) {
            if (self._asertValidSearch(data)) {
                var taskRef = self.rootRef.child(self.tasksRefPath),
                    id = data['_key'],
                    requestRef = taskRef.child( id),
                    responseRef = data.responseUrl ? firebaseUtil.ref(data.responseUrl) : self.rootRef.child(self.responseRefPath).child(id);
                self.esc.search(data, onSearchComplete);
            }
            function onSearchComplete(error, response) {
                if (error) {
                    reject(error);
                } else {
                    var _response = {
                        request: data,
                        result: response.hits
                    };
                    _response.result.usage = {
                        times: 1,
                        last: firebaseUtil.ServerValue.TIMESTAMP
                    };
                    responseRef
                        .update(_response, function (err) {
                            if (err) reject(err);
                            if(!data.cache) responseRef.onDisconnect().remove();
                            requestRef.onDisconnect().remove();
                            setTimeout(function () {
                                if(!data.cache) {
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
    _syncCache: function () {
        var self = this;

        function onSearchComplete(responseRef, emitter) {
            return function (error, response) {
                if (error) {
                    emitter.emit('error', error);
                } else {
                    var result = response.hits;
                    result.usage = {
                        times: 1,
                        last: firebaseUtil.ServerValue.TIMESTAMP
                    };
                    responseRef
                        .set(result, function (err) {
                            if (err) emitter.emit('error', error);
                        });
                }
            }
        }

        if (this.esc.emitter) {
            function sync() {
                self.cacheRef.once('value', function (snap) {
                    snap.forEach(function (childSnap) {
                        var responseRef = childSnap.child('result').ref();
                        //TODO: 做一個FUNC確認這個快取是否需要留下來
                        self.esc.search(childSnap.child('request').val(), onSearchComplete(responseRef, self.esc.emitter))
                    })
                })
            }
            this.esc.emitter.on('index_changed', util.debounce(sync, 10000));
        }
    },
    _isJson: function (str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
};

exports.init = function (esc, fbUrl, tasksRefPath, options) {
    new SearchQueue(esc, fbUrl, tasksRefPath, options);
};
