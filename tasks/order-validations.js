var config = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    resolver = require('../lib/resolver'),
    orderValidator = require('../lib/orderValidator');

var rootRef = firebaseUtil.ref('https://quartz.firebaseio.com/');
var queue = firebaseUtil.queue(rootRef, {tasksRefPath:'orders'}, function(data, progress, resolve, reject){
    if(data.cart&&!orderValidator(data).isValid()) reject('invalid totalAmount');

    switch(data.payment.type){
        case 'stripe':
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'verified';
            if(data.id) rootRef.child('orders/'+data.id).update(data);
            resolve();
            break;
        case 'allpay':
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'verified';
            data.payment.allpay.CheckMacValue = allpay.genCheckMacValue(data.payment.allpay);
            if(data.id) rootRef.child('orders/'+data.id).update(data);
            resolve();
            break;
    }
});