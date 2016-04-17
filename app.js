var app = require('./lib/expressApp'),
    auth = require('./lib/auth'),
    watch = require('./lib/watch'),
    routes = require('require-dir')('./routes'),
    config = require('./config'),
    initEsc = require('./lib/esc'),
    serverGroup = require('./lib/servers')(config);

auth()
    .then(serverGroup.getReadyPromise)
    .then(function (serverId) {
        console.log('start server: ' + serverId);

        var tasks = require('require-dir')('./tasks'),
            routes = require('require-dir')('./routes'),
            escPromise = initEsc({
                port: 9200,
                ip: "localhost",
                retry: 5
            });
        ///////////////////

        escPromise.then(function (esc) {
            tasks['index'](esc);
            tasks['search'](esc);

            tasks['order-validations']();
        }, function(err){
            console.log(err);
        });
        routes['allpayReceive']();
        routes['allpayPaymentInfo']();



        // tasks['elasticsearch-index-paths'](config);

        ///////////////////
        var port = /*process.env.PORT || 8080*/ 3000;
        //// use sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
        app.listen(port, function () {
            console.log('Server listening on: http://104.196.19.150:80')
        });

    });

