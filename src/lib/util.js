var q = require('q'),
    _ = require('lodash'),
    LZString  = require('lz-string');

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

function to2dig(num) {
    return num < 10 ? ('0' + num) : num;
}


function delayed(resolve, delay) {
    var timeout = setTimeout(function () {
        resolve();
    }, delay || 10000);
    return {
        immediate:function(){
            clearTimeout(timeout);
            resolve();
        },
        cancel: function(){
            clearTimeout(timeout);
        }
    }
}

function compress(data) {
    return LZString.compressToUTF16(JSON.stringify(data));
}

function decompress(val) {
    if (!val||!val.compressed) return val;

    var decompressed, res;
    if (val.compressed) {
        decompressed = JSON.parse(LZString.decompressFromUTF16(val.compressed));
    }


    if(_.isObject(decompressed)&&!_.isArray(decompressed)){
        res = _.extend({}, val, decompressed);
        delete res.compressed;
    } else {
        res = decompressed;
    }

    return res;
}

module.exports = {
    resolve: resolve,
    compress:compress,
    decompress:decompress,
    debounce:debounce,
    delayed:delayed,
    to2dig:to2dig
};