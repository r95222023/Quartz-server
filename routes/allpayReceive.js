var app = require('../lib/expressApp'),
    allpay = require('allpay'),
    config = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util');

function init() {
    app.post('/allpayReceive', function (req, res) {
        console.log(req.body);
        console.log('check' + allpay.genCheckMacValue(req.body));

        var siteName = req.params('sitename'),
            uid = req.params('uid');
        if (validateData(req.body)) {
            updateMain(siteName, req.body);
            updateUser(siteName, uid, req.body);
        } else {
            console.log('invalid order detected:' + JSON.stringify(req.body));
        }
        res.status(200).send('1|OK');
    });
}

function validateData(data) {
    return data['CheckMacValue'] === allpay.genCheckMacValue(data);
}

function updateMain(siteName, data) {
    delete data.CheckMacValue;
    var refUrl = config.FBURL + 'sites/detail/' + siteName;
    updateOrder(refUrl, data);
}

function updateUser(siteName, uid, data) {
    var userOrderRefUrl = config.FBURL + '/sites/detail/' + siteName + '/users/detail/' + uid;
    updateOrder(userOrderRefUrl, data)
}

function updateOrder(refUrl, data) {
    var _data = {};
    _data['orders/detail/' + data.MerchantTradeNo + '/payment'] = {allpay: data, status: 'paid'};
    _data['orders/list/' + data.MerchantTradeNo + '/payment'] = {status: 'paid'};
    firebaseUtil.ref(refUrl).update(_data)
}


module.exports = init;