var defaultConfig = require('../config'),
    Allpay = require('allpay'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util'),
    _ = require('lodash'),
    orderService = require('../lib/orderService'),
    emitter = require('../lib/emitter');

function initAllpay(config) {
    var genChkOpt = {
            'specId': 'allpay_gen_check_mac',
            'numWorkers': config.numWorkers || 10,
            'sanitize': false,
            'suppressStack': config.suppressStack || true
        },
        tempOrderOpt = {
            'specId': 'allpay_reg_temp_order',
            'numWorkers': config.numWorkers || 10,
            'sanitize': false,
            'suppressStack': config.suppressStack || true
        },
        rootRef = firebaseUtil.ref(config.FBURL || defaultConfig.FBURL).child("queue");
    firebaseUtil.queue(rootRef, genChkOpt, function (data, progress, resolve, reject) {
        var os = orderService(data);

        if (!os.isValid()) {
            resolve();
        } else {
            rootRef.root.child('sites/' + data.siteName + '/config/payment/' + data.payment.type).once('value', function (paymentParamSnap) {
                var paymentParams = paymentParamSnap.val() || {},
                    publicParams = util.decompress(paymentParams.public) || {},
                    privateParams = util.decompress(paymentParams.private) || {};
                var allpay = new Allpay({
                        // debug: config.ALLPAY.DEBUG,
                        merchantID: publicParams.MerchantID || '2000132',
                        hashKey: privateParams.HashKey || '5294y06JbISpM5x9',
                        hashIV: privateParams.HashIV || 'v77hoKGq4kWxNNIS'
                    }),
                    CheckMacValue = allpay.genCheckMacValue(data.payment.allpay),
                    orderRef = rootRef.child('tasks').child(data['_id']);
                data.payment.allpay.CheckMacValue = CheckMacValue;

                orderRef.child('payment/allpay/CheckMacValue').set(CheckMacValue)
                    .then(function () {
                        //
                        // _.assign(data.payment.allpay, msg.data, {
                        //     CheckMacValue: null,
                        //     PaymentInfoURL: null,
                        //     ReturnURL: null
                        // });
                        resolve();
                        // os.register().then(function(){
                        //     resolve();
                        // });
                    });

            });

        }

    });
    firebaseUtil.queue(rootRef, tempOrderOpt, function (data, progress, resolve, reject) {
        var os = orderService(data);
        data['_id']=data['_owner']=data['_state']=data['_progress']=data['_state_changed']=null;
        if (!os.isValid()) {
            resolve();
        } else {
            rootRef.root.child('sites/detail/' + data.siteName + '/orders/temp/' + data.id).set(data).then(function(){
                resolve();
            });
        }
    })
}

function initStripe(config) {

    var options = {
            'specId': 'order_validate_stripe',
            'numWorkers': config.numWorkers || 10,
            'sanitize': false,
            'suppressStack': config.suppressStack || true
        },
        rootRef = firebaseUtil.ref(config.FBURL || defaultConfig.FBURL).child("queue");
    var queue = firebaseUtil.queue(rootRef, options, function (data, progress, resolve, reject) {
        var os = orderService(data);

        if (!os.isValid()) {
            resolve();
            return;
        }

        rootRef.root.child('sites/' + data.siteName + '/config/payment/' + data.payment.type).once('value', function (paymentParamSnap) {
            var paymentParams = paymentParamSnap.val() || {},
                publicParams = paymentParams.public || {},
                privateParams = paymentParams.private || {};

            os.add(data)
                .then(os.charge)
                .then(resolve);
        });
    });
}


function init(config) {
    var _config = config || {};

    initAllpay(_config);
    initStripe(_config);
}


module.exports = init;
