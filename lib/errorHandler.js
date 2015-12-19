var errorList={
    AUTH_ERROR:''
};

module.exports= function(error, opt){
    var _opt=opt||{};
    if (typeof errorList[_opt.errorTyper] === 'function') {
        errorList[_opt.errorTyper].apply(null, error);
    } else {
        console.log(_opt.errorTyper+':'+JSON.stringify(error))
    }
};
