var elasticsearch = require('elasticsearch'),
    servers = require('../lib/servers'),
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
    def.promise.then(function (client) {
        var PathMonitor = require('../lib/esPathMonitor');
        PathMonitor.process(client, config.FBURL, false, 'config/server/index');
    }, function (error) {
        console.log(error);
    });
};


