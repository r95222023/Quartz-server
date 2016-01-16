var config = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil');


function SearchQueue(esc, rootRef, tasksRefPath, cleanupInterval) {
    this.esc = esc;
    this.rootRef = rootRef || config.FBURL;
    this.tasksRefPath = tasksRefPath;
    this.cleanupInterval = cleanupInterval;

    this._process();
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
                    requestRef = taskRef.child('request/' + id),
                    responseRef = data.responseUrl ? firebaseUtil.ref(data.responseUrl) : taskRef.child('response/' + id);
                self.esc.search(data, onSearchComplete);
                console.log(data.responseUrl)
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
                            requestRef.onDisconnect().remove();
                            setTimeout(function () {
                                requestRef.onDisconnect().cancel();
                                resolve();
                            }, self.cleanupInterval)
                        });
                }
            }
        });
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

exports.init = function (esc, fbUrl, tasksRefPath, cleanupInterval) {
    var rootRef = firebaseUtil.ref(fbUrl);
    new SearchQueue(esc, rootRef, tasksRefPath, cleanupInterval);
};
