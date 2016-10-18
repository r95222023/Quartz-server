var errorList={
    AUTH_ERROR:''
};

module.exports= function(error, opt, reject){
    var _opt=opt||{};
    if (typeof errorList[_opt.code] === 'function') {
        errorList[_opt.code].apply(null, error);
    } else {
        console.log(_opt.code+':'+JSON.stringify(error))
    }
    if(typeof reject==='function'){reject(error)}
};
