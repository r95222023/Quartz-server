var app = require('./lib/expressApp'),
    auth = require('./lib/auth'),
    //execPhp = require('./lib/php/execPhp'),
    //watch = require('./lib/watch'),
    //watch_list = require('require-dir')('./watch_list'),
    routes = require('require-dir')('./routes'),
    config = require('./config'),
    serverGroup = require('./lib/servers')(config),
    exec = require('child_process').exec;


auth()
    .then(serverGroup.getReadyPromise)
    .then(function (serverId) {
        console.log('start server: ' + serverId);
        //var watchList = [];
        //for (var key in watch_list) {
        //    watchList.push(watch_list[key])
        //}
        //watch(watchList);

        var tasks = require('require-dir')('./tasks');
        ///////////////////


        tasks['elasticsearch-index-paths'](config)
            .then(function (esc, conf) {
                tasks['search-queue'].init(esc, config.FBURL, 'query',{
                    cleanupInterval:5000
                });
                //tasks['state_change_order_status'](config.FBURL, 'queue', {})
            });
        ///////////////////
        var port = /*process.env.PORT || 8080*/ 3000;
        //// for linux, since port above 1000 is locked we have to use sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
        //// to map port 80 to port 3000
        app.listen(port, function () {
            console.log('Server listening on: http://104.196.19.150:80')
        });

    });

