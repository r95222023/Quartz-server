var elasticsearch = require('elasticsearch'),
    servers = require('../lib/servers');

var client = new elasticsearch.Client({
    host: 'localhost:9200'/*,
    log: 'trace'*/
});

module.exports = function (config) {
    var PathMonitor = require('../lib/esPathMonitor');
    PathMonitor.process(client, config.FBURL, [
        {
            path: "orders",
            index: "quartz",
            type: "order"
        },
        {
            path: "users",
            index: "quartz",
            type: "user"
        }
    ]);

};


