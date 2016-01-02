var config = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    resolver = require('../lib/resolver'),
    orderValidator = require('../lib/orderValidator');

function getTotalAmt(order) {
    for(var key in order.cart){
        //
    }
}


var rootRef = firebaseUtil.ref('https://quartz.firebaseio.com/');
var queue = firebaseUtil.queue(rootRef, {tasksRefPath:'orders'}, function(data, progress, resolve, reject){
    if(data.cart&&!orderValidator(data).isValid()) reject('invalid totalAmount');

    switch(data.payment.type){
        case 'stripe':
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'validated';
            if(data.id) rootRef.child('orders/'+data.id).update(data);
            break;
        case 'allpay':
            data['_owner']=data['_state_changed']=data['_progress']=null; data['_state'] = 'validated';
            data.payment.allpay.CheckMacValue = allpay.genCheckMacValue(data.payment.allpay);
            rootRef.child('orders/'+data.id).update(data, function () {
                console.log(data);
            });
            //var updateData = {};
            //
            //var indicator =['_owner','_state','_state_changed','_progress'],
            //    indicatorValue = [null,'stored',null,null];
            //for (var i = 0; i < indicator.length; i++) {
            //    updateData['orders/'+data.id+'/'+indicator[i]]=indicatorValue[i]
            //}
            //updateData['orders/'+data.id+'/payment/allpay/CheckMacValue'] = allpay.genCheckMacValue(data.payment.allpay);
            //resolver.set('index_changed', 'quartz/order/'+tradeID, resolve);

            //rootRef.update(updateData, function () {
            //    //resolve()
            //});
            break;
    }


});
