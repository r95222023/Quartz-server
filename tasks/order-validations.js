var defaultConfig = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    orderService = require('../lib/orderService');




function delayedResolve(resolve, delay) {
    return function () {
        setTimeout(function () {
            resolve();
        }, delay || 10000);
    }
}

function init(config){

    var _config=config||{},
        options = {
            'specId': 'order_validate',
            'numWorkers': _config.numWorkers||1,
            'sanitize': false,
            'suppressStack': _config.suppressStack||true
        },
        rootRef = firebaseUtil.ref(_config.FBURL||defaultConfig.FBURL).child("queue");
    var queue = firebaseUtil.queue(rootRef, options, function (data, progress, resolve, reject) {
        switch (data.payment.type) {
            case 'stripe':
                //var os =orderService(data, config)
                //os.add(data)
                // .then(os.charge)
                // .then(resolve);
                break;
            case 'allpay':
                var os =orderService(data);
                if (os.isValid()) {
                    var CheckMacValue = allpay.genCheckMacValue(data.payment.allpay);
                    firebaseUtil.ref(defaultConfig.FBURL).child('queue/tasks').child(data['_id']).child('payment/allpay/CheckMacValue').set(CheckMacValue)
                        .then(function () {
                            //var os =orderService(data, config)
                            //return os.add(data)
                        })
                        .then(delayedResolve(resolve, 10000));
                } else {
                    reject("invalid data");
                    return;
                }
                break;
        }


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
