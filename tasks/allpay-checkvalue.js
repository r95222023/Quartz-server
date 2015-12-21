var config = require('../config'),
    allpay = require('../lib/allpay'),
    firebaseUtil = require('../lib/firebaseUtil');

function getTotalAmt(order) {
    for(var key in order.cart){
        //
    }
}


var queRef = firebaseUtil.ref('https://quartz.firebaseio.com/');
var queue = firebaseUtil.queue(queRef, {tasksRefPath:'orders'}, function(data, progress, resolve, reject){
    var tradeID = data.payment.allpay.MerchantTradeNo;

    var updateData = {};

    var indicator =['_owner','_state','_state_changed','_progress'],
        indicatorValue = [null,'stored',null,null];
    for (var i = 0; i < indicator.length; i++) {
        updateData['orders/'+tradeID+'/'+indicator[i]]=indicatorValue[i]
    }

    updateData['orders/'+tradeID+'/payment/allpay/CheckMacValue'] = allpay.genCheckMacValue(data.payment.allpay);

    queRef.update(updateData, function () {
        resolve()
    });
});