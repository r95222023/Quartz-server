var elasticsearch = require('elasticsearch'),
    servers = require('../lib/servers'),
    net = require('net'),
    q = require('q');

var def = q.defer(),
    retry = 0;

function init() {
    net.connect(9200, 'localhost', function() {
    }).on('connect', function () {
        console.log('connect');
        var client = new elasticsearch.Client({
            host: 'localhost:9200'/*,
             log: 'trace'*/
        });
        def.resolve(client);
    }).on('error', function (err) {
        setTimeout(init, 5000);
        retry++;
        if(retry>3) def.reject('Elasticsearch is offline');
    }).on('close', function () {
        console.log('Elasticsearch is offline');
    });
}

init();


module.exports = function (config) {
    def.promise.then(function (client) {
        var PathMonitor = require('../lib/esPathMonitor');
        PathMonitor.process(client, config.FBURL, false, 'config/server/index');
    }, function (error) {
        console.log(error)
    });
};



