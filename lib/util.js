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

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

module.exports = {
    resolve: resolve,
    debounce:debounce
};