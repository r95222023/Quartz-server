var allpayService = require('./allpay.service');

var validateData = allpayService.validateData,
    updateMain = allpayService.updateMain,
    updateUser = allpayService.updateUser;

function init(app) {
    app.post('/allpayPaymentInfo', function (req, res) {
        console.log(req.body);
        var siteName = req.params('sitename'),
            uid = req.params('uid');
        if (validateData(req.body)) {
            updateMain(siteName, req.body, 'pending');
            updateUser(siteName, uid, req.body, 'pending');
        } else {
            console.log('invalid order detected:' + JSON.stringify(req.body));
        }

        res.status(200).send('1|OK');
    });
}


module.exports = init;
