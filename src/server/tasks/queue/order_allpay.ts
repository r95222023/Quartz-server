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

    if (!order.isValid()) {
      resolve();
    } else {
      firebaseUtil.ref('site-config-payment?provider=allpay&siteName='+data.siteName).once('value', function (paymentParamSnap: any) {
        var paymentParams = paymentParamSnap.val() || {},
          publicParams = lzString.decompress(paymentParams.public) || {},
          privateParams = lzString.decompress(paymentParams.private) || {};
        var oid=data['_id'];
        var allpay = new Allpay({
            // debug: config.ALLPAY.DEBUG,
            merchantID: publicParams.MerchantID || '2000132',
            hashKey: privateParams.HashKey || '5294y06JbISpM5x9',
            hashIV: privateParams.HashIV || 'v77hoKGq4kWxNNIS'
          });
        var CheckMacValue = allpay.genCheckMacValue(data.payment.allpay);

          data.payment.allpay.CheckMacValue = CheckMacValue;

        Promise.all([
          queueRef.child('tasks/'+oid+'/payment/allpay/CheckMacValue').set(CheckMacValue),
          firebaseUtil.ref('temps?type=payment&provider=allpay').child(oid).update(data)
        ]).then(function(){
          resolve();
        }).catch(reject)
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
