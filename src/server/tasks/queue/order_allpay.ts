var Allpay = require('allpay'),
    firebaseUtil = require('../components/firebaseUtil/firebaseUtil.service'),
    lzString = require('../components/encoding/lzString'),
    orderService = require('../components/order/order.service');

let initAllpay = (config: any)=> {
    var genChkOpt = {
            'specId': 'allpay_gen_check_mac',
            'numWorkers': config.numWorkers || 10,
            'sanitize': false,
            'suppressStack': config.suppressStack || true
        },
        // tempOrderOpt = {
        //   'specId': 'allpay_reg_temp_order',
        //   'numWorkers': config.numWorkers || 10,
        //   'sanitize': false,
        //   'suppressStack': config.suppressStack || true
        // },
        queueRef = firebaseUtil.ref('queue');

    //gen_check_mac
    firebaseUtil.queue(queueRef, genChkOpt, (data: any, progress: any, resolve: any, reject: any) => {
        var order = orderService(data);
        var siteName = data.siteName;
        if (!order.isValid()) {
            resolve();
        } else {
            firebaseUtil.ref('site-config-payment?provider=allpay&siteName=' + siteName).once('value', function (paymentParamSnap: any) {
                var paymentParams = paymentParamSnap.val() || {},
                    publicParams = lzString.decompress(paymentParams.public) || {},
                    privateParams = lzString.decompress(paymentParams.private) || {};
                var taskId = data.taskId; // taskId===unique orderId
                var allpayParams=data.payment.allpay;
                var allpay = new Allpay({
                    // debug: config.ALLPAY.DEBUG,
                    merchantID: publicParams.MerchantID || '2000132',
                    hashKey: privateParams.HashKey || '5294y06JbISpM5x9',
                    hashIV: privateParams.HashIV || 'v77hoKGq4kWxNNIS'
                });
                var CheckMacValue = allpay.genCheckMacValue(allpayParams);

                allpayParams.CheckMacValue = CheckMacValue;

                var tempRef = firebaseUtil.ref('site-temps?type=order-allpay&siteName=' + siteName).child(allpayParams.MerchantTradeNo);

                Promise.all([
                    queueRef.child('tasks/' + taskId + '/payment/allpay/CheckMacValue').set(CheckMacValue),
                    tempRef.update(data)
                ]).then(function () {
                    resolve();
                }).catch(reject);
                setTimeout(function(){ //delete temp file after 15 mins
                    tempRef.set(null);
                },900000);
            });
        }
    });
    // firebaseUtil.queue(rootRef, tempOrderOpt, function (data: any, progress: any, resolve: any, reject: any) {
    //   var os = orderService(data);
    //   data['_id'] = data['_owner'] = data['_state'] = data['_progress'] = data['_state_changed'] = null;
    //   if (!os.isValid()) {
    //     resolve();
    //   } else {
    //     rootRef.root.child('sites/detail/' + data.siteName + '/orders/temp/' + data.id).set(data).then(function () {
    //       resolve();
    //     });
    //   }
    // })
};

module.exports = (config: any) => {
    var _config = config || {};

    initAllpay(_config);
};
