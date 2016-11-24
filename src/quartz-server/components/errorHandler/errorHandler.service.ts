let errorList:any={
    AUTH_ERROR:''
};

export = function(error:any, opt:any, reject:any){
    let _opt:any=opt||{};
    if (typeof errorList[_opt.code] === 'function') {
        errorList[_opt.code].apply(null, error);
    } else {
        console.log(_opt.code+':'+JSON.stringify(error))
    }
    if(typeof reject==='function'){reject(error)}
};
