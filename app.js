var app = require('./src/lib/expressApp'),
    routes = require('require-dir')('./src/routes'),
    config = require('./src/config'),
    initEsc = require('./src/lib/esc'),
    serverGroup = require('./src/lib/servers')(config);

serverGroup.getReadyPromise()
    .then(function (serverId) {
        console.log('start server: ' + serverId);

        var tasks = require('require-dir')('./src/tasks'),
            routes = require('require-dir')('./src/routes'),
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




        ///////////////////
        var port = /*process.env.PORT || 8080*/ 3000;
        //// use sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
        app.listen(port, function () {
            console.log('Server listening on: http://104.196.19.150:80')
        });

    });

