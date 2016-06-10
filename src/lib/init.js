var q = require('q'),
    config = require('../config');

module.exports=function(opt){
    var def= q.defer(),
        _opt = typeof opt=== 'object'? opt:{};
    for(var key in _opt){
        if(_opt.hasOwnProperty(key)) config[key]=opt[key]
    }
    def.resolve(_opt);
    return def.promise
};