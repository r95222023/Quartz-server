var allpay = require('allpay'),
    analytics = require('../lib/analytics'),
    allpayService = require('./allpay.service');

var validateData = allpayService.validateData,
    updateMain = allpayService.updateMain,
    updateUser = allpayService.updateUser;

function init(app) {
    app.post('/allpayReceive', function (req, res) {
        console.log(req.body);
        console.log('check' + allpay.genCheckMacValue(req.body));

        var siteName = req.params('sitename'),
            uid = req.params('uid');
        if (validateData(req.body)) {
            analytics.update(siteName, req.body.MerchantTradeNo);
            updateMain(siteName, req.body, 'paid');
            updateUser(siteName, uid, req.body, 'paid');
        } else {
            console.log('invalid order detected:' + JSON.stringify(req.body));
        }
        res.status(200).send('1|OK');
    });
}

module.exports = init;