var app = require('./lib/expressApp'),
    auth = require('./lib/auth'),
//execPhp = require('./lib/php/execPhp'),
    watch = require('./lib/watch'),
    watch_list = require('require-dir')('./watch_list'),
    routes = require('require-dir')('./routes'),
    config = require('./config'),
    serverGroup = require('./lib/servers')(config);


auth().then(function () {

    var watchList = [];
    for (var key in watch_list) {
        watchList.push(watch_list[key])
    }
    watch(watchList);
    //execPhp('test.php').then(function(php, outprint){
    //    console.log(outprint);
    //    console.log(php);
    //}, function(error){
    //    console.log(error);
    //})


    ///////////////////
    var port = /*process.env.PORT || 8080*/ 3000;
    //// use sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
    app.listen(port, function () {
        console.log('Server listening on: http://104.196.19.150:80')
    });

});