var app = require('../lib/expressApp'),
    emitter = require('../lib/emitter');

function resolve(res){
    return function (){
        res.status(200).send('1|OK');
    }
}

function init(config){
    app.post('/allpayPaymentInfo', function (req, res) {
        emitter.emit('allpay_order_established',{provider:'allpay', data:req.body, siteName:req.query.siteName, resolve:resolve(res)});
    });

    app.post('/allpayReceive', function (req, res) {
        emitter.emit('allpay_payment_received',{provider:'allpay', data:req.body, siteName:req.query.siteName, resolve:resolve(res)});
    });

    app.post('/allpayPeriodicReceive', function (req, res) {
        emitter.emit('allpay_periodic_payment_received',{provider:'allpay', data:req.body, siteName:req.query.siteName, resolve:resolve(res)});
    });
}


module.exports = init;
