var elasticsearch = require('elasticsearch'),
    http = require('http'),
    q = require('q');

var def = q.defer(),
    retry = 0;


var options = {
    hostname: 'localhost',
    port: 9200,
    path: '/'
};

function checkConnection(){
    http.get(options, function(res) {
        initEs();
    }).on('error', function (error) {
        retry++;
        if(retry>3) {
            def.reject('Elasticsearch is offline');
        } else {
            setTimeout(checkConnection, 10000)
        }
    });
}


function initEs(){
    var client = new elasticsearch.Client({
        host: 'localhost:9200'/*,
         log: 'trace'*/
    });
    def.resolve(client);
}

checkConnection();


module.exports = function (config) {
    var escDefer = q.defer();
    def.promise.then(function (client) {
        var PathMonitor = require('../lib/esPathMonitor');
        //for static path, use the following
        // PathMonitor.process(client, config.FBURL, [
        //    {
        //        path:  "orders",
        //        index: "quartz",
        //        type:  "order"
        //    }
        //]);
        PathMonitor.process(client, config.FBURL, false, 'config/server/index');
        escDefer.resolve(client, config);
    }, function (error) {
        escDefer.reject(error);
        console.log(error);
    });
    return escDefer.promise;
};


