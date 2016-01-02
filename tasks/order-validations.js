var config = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    resolver = require('../lib/resolver'),
    orderValidator = require('../lib/orderValidator');


var rootRef = firebaseUtil.ref('https://quartz.firebaseio.com/'),
    options = {
        'specId': 'validation',
        'numWorkers': 1,
        'sanitize': false,
        'suppressStack': true,
        'tasksRefPath': 'orders',
        //'specsRefPath':'config/server/queue/orderSpecs'
    };


var queue = firebaseUtil.queue(rootRef, options, function (data, progress, resolve, reject) {
    if(data.cart&&!orderValidator(data).isValid()) reject('invalid totalAmount');

    switch(data.payment.type){
        case 'stripe':
            //charge
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'validated';
            if(data.id) rootRef.child('orders/'+data.id).update(data);
            break;
        case 'allpay':
            data.payment.allpay.CheckMacValue = allpay.genCheckMacValue(data.payment.allpay);
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'validated';
            if(data.id) rootRef.child('orders/'+data.id).update(data);
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

