var app = require('./lib/expressApp'),
    auth = require('./lib/auth'),
//execPhp = require('./lib/php/execPhp'),
    watch = require('./lib/watch'),
    watch_list = require('require-dir')('./watch_list'),
    routes = require('require-dir')('./routes'),
    config = require('./config'),
    serverGroup = require('./lib/servers')(config),
    exec = require('child_process').exec;


auth()
    .then(serverGroup.getReadyPromise)
    .then(function (serverId) {
        console.log('start server: '+serverId);
        var watchList = [];
        for (var key in watch_list) {
            watchList.push(watch_list[key])
        }
        //watch(watchList);
        //execPhp('test.php').then(function(php, outprint){
        //    console.log(outprint);
        //    console.log(php);
        //}, function(error){
        //    console.log(error);
        //})

        //exec("/opt/elasticsearch-2.1.1/bin/elasticsearch", function (error, stdout, stderr) {
        //    console.log(stdout,stderr);
        //    if (error !== null) {
        //        console.log('exec error: ' + error);
        //    }
        //});
        require('require-dir')('./tasks');
        ///////////////////

        var elasticsearch = require('elasticsearch');
        var client = new elasticsearch.Client({
            host: 'localhost:9200',
            log: 'trace'
        });
        var PathMonitor = require('./lib/PathMonitor');
        PathMonitor.process(client, config.FBURL, [
            {
                path:  "orders",
                index: "quartz",
                type:  "order"
            }
        ], 'orders');

        ///////////////////
        var port = /*process.env.PORT || 8080*/ 3000;
        //// use sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
        app.listen(port, function () {
            console.log('Server listening on: http://104.196.19.150:80')
        });

    });

