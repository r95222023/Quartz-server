var elasticsearch = require('elasticsearch'),
    http = require('http'),
    // net = require('net'),
    q = require('q');
const EventEmitter = require('events');


var def = q.defer(),
    retry = 0;

// function init(config) {
//     net.connect(config.port, config.ip, function() {
//     }).on('connect', function () {
//         console.log('connect');
//         var client = new elasticsearch.Client({
//             host: config.ip+":"+config.port/*,
//              log: 'trace'*/
//         });
//         def.resolve(client);
//     }).on('error', function (err) {
//         setTimeout(init, 5000);
//         retry++;
//         if(retry>(config.retry||3)) def.reject('Elasticsearch is offline');
//     }).on('close', function () {
//         console.log('Elasticsearch is offline');
//     });
//     return def.promise;
// }

function initEs(config) {
    var client = new elasticsearch.Client({
        host: config.ip+":"+config.port/*,
         log: 'trace'*/
    });
    client.emitter = new EventEmitter();

    def.resolve(client);
}

function checkConnection(config) {
    var options = {
        hostname: config.ip,
        port: config.port,
        path: '/'
    };
    http.get(options, function (res) {
        initEs(config);
    }).on('error', function (error) {
        retry++;
        if (retry > (config.retry||3)) {
            def.reject('Elasticsearch is offline');
        } else {
            console.log('cant find elasticsearch service, attempt to retry:'+retry);
            setTimeout(function(){checkConnection(config)}, 10000)
        }
    });
    return def.promise;
}


module.exports = checkConnection;


