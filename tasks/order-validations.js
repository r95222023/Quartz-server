var defaultConfig = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util'),
    orderService = require('../lib/orderService');



function init(config){

    var _config=config||{},
        options = {
            'specId': 'order_validate',
            'numWorkers': _config.numWorkers||10,
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
                    var CheckMacValue = allpay.genCheckMacValue(data.payment.allpay),
                        orderRef = rootRef.child('tasks').child(data['_id']);
                    orderRef.child('payment/allpay/CheckMacValue').set(CheckMacValue)
                        .then(function(){
                            var delay = util.delayed(function(){
                                orderRef.child('status').off();
                                resolve();
                            }, data.waiting||60000);
                            
                            orderRef.child('status').on('value', function(snap){
                                if(snap.val()==='established'){
                                    console.log('established');
                                    delay.immediate();
                                    //var os =orderService(data, config)
                                    //return os.add(data)
                                }
                            })
                        });
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
