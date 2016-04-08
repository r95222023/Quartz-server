var elasticsearch = require('elasticsearch'),
    net = require('net'),
    q = require('q');

var def = q.defer(),
    retry = 0;

function init(config) {
    net.connect(config.port, config.ip, function() {
    }).on('connect', function () {
        console.log('connect');
        var client = new elasticsearch.Client({
            host: config.ip+":"+config.port/*,
             log: 'trace'*/
        });
        def.resolve(client);
    }).on('error', function (err) {
        setTimeout(init, 5000);
        retry++;
        if(retry>(config.retry||3)) def.reject('Elasticsearch is offline');
    }).on('close', function () {
        console.log('Elasticsearch is offline');
    });
    return def.promise;
}

module.exports = init;


