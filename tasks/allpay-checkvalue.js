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
    queRef.child('orders/'+tradeID).update({
        _owner:null,
        _state:'stored',
        _state_changed:null,
        _progress:null
    });
    queRef.child('orders/'+tradeID+'/payment/allpay').update({
        CheckMacValue: allpay.genCheckMacValue(data.payment.allpay)
    }, function () {
        resolve()
    });
});