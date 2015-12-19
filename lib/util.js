var q = require('q'),
    _ = require('lodash');

function resolve(promiseList, localPromises, globalPromises) {
    var promises = [];
    _.forEach(promiseList, function (promiseName, i) {
        if (typeof promiseName === 'string') promises[i] = localPromises[promiseName] || globalPromises[promiseName]
    });
    //if(promises.length===0) {var def= q.defer(); def.resolve();}
    return q.all(promises)
}

module.exports = {
    resolve: resolve
};