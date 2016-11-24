let q = require('q'),
    _ = require('lodash'),
    LZString  = require('lz-string');

function resolve(promiseList:any, localPromises:any, globalPromises:any) {
    let promises:any[] = [];
    _.forEach(promiseList, function (promiseName:any, i :number) {
        if (typeof promiseName === 'string') promises[i] = localPromises[promiseName] || globalPromises[promiseName]
    });
    //if(promises.length===0) {var def= q.defer(); def.resolve();}
    return q.all(promises)
}


function debounce(func:any, wait:any, immediate?:boolean) {
  let timeout:any;
    return function () {
      let context = this, args = arguments;
      let later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
      let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function to2dig(num:number) {
    return num < 10 ? ('0' + num) : num+'';
}


function delayed(resolve:any, delay:any) {
  let timeout = setTimeout(function () {
        resolve();
    }, delay || 10000);
    return {
        immediate:function(){
            window.clearTimeout(timeout);
            resolve();
        },
        cancel: function(){
          window.clearTimeout(timeout);
        }
    }
}

function compress(data:any) {
    return LZString.compressToUTF16(JSON.stringify(data));
}

function decompress(val:any) {
    if (!val||!val.compressed) return val;

  let decompressed:any, res:any;
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

export= {
    resolve: resolve,
    compress:compress,
    decompress:decompress,
    debounce:debounce,
    delayed:delayed,
    to2dig:to2dig
};