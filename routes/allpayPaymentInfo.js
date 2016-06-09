var app = require('../lib/expressApp'),
    allpay = require('../lib/allpay'),
    config = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil');


function init(){

    app.post('/allpayPaymentInfo', function (req, res) {
        console.log(req.body);
        var siteName = req.params('sitename');
        // updateMain(siteName,req.body);
        // updateUser(siteName,req.body);
        res.status(200).send('1|OK');
    });
}

function updateMain(siteName, data) {
    if (allpay.validateData(data)) {
        delete data.CheckMacValue;
        var refUrl = 'sites/detail/'+siteName+'/orders/detail/' + data.MerchantTradeNo + '/payment';
        updateOrder(refUrl, data);
    } else {
        console.log('invalid data')
    }
}

function updateUser(data) {
    var refUrl = orderUrl + '/' + data.MerchantTradeNo + '/clientInfo/uid';
    firebaseUtil.ref(refUrl).once('value', function (snap) {
        if (snap.val === null) return;
        var uid = snap.val(),
            userOrderRefUrl = config.FBURL + '/users/' + uid + config.ORDER_ROOT_PATH + '/' + data.MerchantTradeNo + '/payment';
        updateOrder(userOrderRefUrl, data);
    })
}

function updateOrder(refUrl, data) {
    firebaseUtil.ref(refUrl).update({allpay: data, status: 'waiting'})
}

module.exports = init;
