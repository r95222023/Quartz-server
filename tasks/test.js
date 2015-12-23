var elasticsearch = require('elasticsearch'),
    servers = require('../lib/servers');

var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

//
//setTimeout(function () {
//    client.search({
//        index: 'quartz',
//        q: 'ChoosePayment:ALL'
//    }, function (error, response) {
//        console.log(response.hits.hits.length);
//        console.log(JSON.stringify(response));
//    });
//}, 10000);
