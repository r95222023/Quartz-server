var util = require('./util'),
    q = require('q'),
    _ = require('lodash'),
    firebaseUtil = require('./firebaseUtil'),
    errorHandler = require('./errorHandler');

function watch(watchList, globalPromises) {
    _.forOwn(watchList, function (value, key) {
        var refUrl = value.refUrl || key,
            opt = value.options || {},
            tasks = value.tasks || {},
            ref = firebaseUtil.ref(refUrl, opt);

        ref.on('child_added', function (snap) {
            var promises = {snapshot: snap};

            _.forOwn(tasks, function (task, handlerName) {
                var isArray = _.isArray(task),
                    _handler = isArray ? _.last(task) : task.handler,
                    _resolve = isArray ? _.dropRight(task) : task.resolve;

                promises[handlerName] = util.resolve(_resolve, promises, globalPromises || {})
                    .spread(_handler);
            });
        }, function (error) {
            errorHandler(error);
        })
    })
}

//watch(watchList);
module.exports = watch;
