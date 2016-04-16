var app = require('../lib/expressApp'),
    allpay = require('../lib/allpay');

function init() {
    app.post('/allpayReceive', function (req, res) {
        console.log(req.body);
        console.log('check' + allpay.genCheckMacValue(req.body));
        res.status(200).send('1|OK');
    });
}

function allpayReturnHandler(data) {
    var checkValue = data['CheckMacValue'];
    validateReceivedData(data);
    console.log(allpay.genCheckMacValue(data));
    if (checkValue === allpay.genCheckMacValue(data)) console.log('data validated')
}

function updateUserOrders(data) {


    console.log(data);
    console.log('mac=' + allpay.genCheckMacValue(data))
}

function validateReceivedData(data) {
    for (var key in data) {
        if (data[key] === '') delete data[key];
    }
    console.log(allpay.genCheckMacValue(data))
}


module.exports = init;