import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import lzString = require('../../components/encoding/lzString');
import orderService = require('../../components/order/order.service');

let Allpay = require('allpay');

let initAllpay = (config: any) => {
  let genChkOpt = {
      'specId': 'plan_allpay_gen_check_mac',
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
    let order = new orderService.Order(data);
    if (order.orderData.totalAmount!==data.totalAmount) {
      resolve();
    } else {
      firebaseUtil.ref('plans?type=config/payment/allpay').once('value', function (paymentParamSnap: any) {
        let paymentParams = paymentParamSnap.val() || {},
          publicParams = lzString.decompress(paymentParams.public) || {},
          privateParams = lzString.decompress(paymentParams.private) || {};
        let taskId = data.taskId; // taskId===unique orderId
        let allpayParams = data.payment.allpay;
        let allpay = new Allpay({
          // debug: config.ALLPAY.DEBUG,
          merchantID: publicParams.MerchantID || '2000132',
          hashKey: privateParams.HashKey || '5294y06JbISpM5x9',
          hashIV: privateParams.HashIV || 'v77hoKGq4kWxNNIS'
        });
        let CheckMacValue = allpay.genCheckMacValue(allpayParams);

        allpayParams.CheckMacValue = CheckMacValue;

        let tempRef = firebaseUtil.ref('plans?type=temp').child(allpayParams.MerchantTradeNo);

        Promise.all([
          queueRef.child('tasks/' + taskId + '/payment/allpay/CheckMacValue').set(CheckMacValue),
          tempRef.update(data)
        ]).then(function () {
          resolve();
        }).catch(reject);
        setTimeout(function () { //delete temp file after 15 mins
          tempRef.set(null);
        }, 900000);
      });
    }
  });
};

module.exports = (config: any) => {
  let _config = config || {};

  initAllpay(_config);
};