var elasticsearch = require('elasticsearch'),
    config = require('../config');

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

var PathMonitor = require('../lib/esPathMonitor');
PathMonitor.process(client, config.FBURL, [
    {
        path:  "orders",
        index: "quartz",
        type:  "order"
    }
], 'orders');

