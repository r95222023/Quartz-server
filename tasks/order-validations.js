var defaultConfig = require('../config'),
    allpay = require('allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util'),
    orderService = require('../lib/orderService');


function init(config) {

    var _config = config || {},
        options = {
            'specId': 'order_validate',
            'numWorkers': _config.numWorkers || 10,
            'sanitize': false,
            'suppressStack': _config.suppressStack || true
        },
        rootRef = firebaseUtil.ref(_config.FBURL || defaultConfig.FBURL).child("queue");
    var queue = firebaseUtil.queue(rootRef, options, function (data, progress, resolve, reject) {
        var os = orderService(data);

        if (!os.isValid()) {
            reject("invalid data");
            return;
        }
        
        rootRef.root.child('sites/' + data.siteName + '/config/payment/' + data.payment.type).once('value', function (paymentParamSnap) {
            var paymentParams = paymentParamSnap.val()||{},
                publicParams = paymentParams.public||{},
                privateParams = paymentParams.private||{};
            switch (data.payment.type) {
                case 'stripe':
                    os.add(data)
                        .then(os.charge)
                        .then(resolve);
                    break;
                case 'allpay':
                    
                    var CheckMacValue = allpay({
                            // debug: config.ALLPAY.DEBUG,
                            merchantID: publicParams.MerchantID||'2000132',
                            hashKey: privateParams.HashKey||'5294y06JbISpM5x9',
                            hashIV: privateParams.HashIV||'v77hoKGq4kWxNNIS'
                        }).genCheckMacValue(data.payment.allpay),
                        orderRef = rootRef.child('tasks').child(data['_id']);
                    data.payment.allpay.CheckMacValue = CheckMacValue;

                    orderRef.child('payment/allpay/CheckMacValue').set(CheckMacValue)
                        .then(function () {
                            var delay = util.delayed(function () {
                                orderRef.child('status').off();
                                resolve();
                            }, data.waiting || 60000);

                            orderRef.child('status').on('value', function (snap) {
                                switch (snap.val()) {
                                    case 'established':
                                        console.log('established');
                                        delay.immediate();
                                        return os.add(data);
                                        break;
                                    case 'canceled':
                                        delay.immediate();
                                        break;
                                }
                            })
                        });

                    break;
            }
        });


        //var tradeID = data.payment.allpay.MerchantTradeNo;
        //var updateData = {};
        //var indicator = ['_owner', '_state', '_state_changed', '_progress'],
        //    indicatorValue = [null, 'stored', null, null];
        //for (var i = 0; i < indicator.length; i++) {
        //    updateData['orders/' + tradeID + '/' + indicator[i]] = indicatorValue[i]
        //}


        //updateData['orders/' + tradeID + '/payment/allpay/CheckMacValue'] = allpay.genCheckMacValue(data.payment.allpay);
        //resolver.set('index_changed', 'quartz/order/'+tradeID, resolve);

        //rootRef.update(updateData, function () {
        //    resolve(data);
        //});
    });
}


module.exports = init;
