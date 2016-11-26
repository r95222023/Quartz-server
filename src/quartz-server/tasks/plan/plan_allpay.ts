import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import lzString = require('../../components/encoding/lzString');
import * as _ from 'lodash';

let Allpay = require('allpay');

let initPlanAllpay = (config: any) => {
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
    firebaseUtil.ref('plans?type=config/payment/allpay').once('value', function (paymentParamSnap: any) {
      let paymentParams = paymentParamSnap.val() || {},
        publicParams = lzString.decompress(paymentParams.public) || {},
        privateParams = lzString.decompress(paymentParams.private) || {};
      let allpayParams =  _.extend({}, publicParams, data.payment.allpay);

      let allpay = new Allpay({
        // debug: config.ALLPAY.DEBUG,
        merchantID: publicParams.MerchantID,
        hashKey: privateParams.HashKey,
        hashIV: privateParams.HashIV
      });

      allpayParams.CheckMacValue = allpay.genCheckMacValue(allpayParams);
      let tempRef = firebaseUtil.ref('plans?type=temp').child(data.id);
      data.payment.allpay=allpayParams;

      Promise.all([
        queueRef.child('tasks/' + data.id + '/payment/allpay').update(allpayParams),
        tempRef.update(data)
      ]).then(function () {
        resolve();
      }).catch(reject);
      setTimeout(function () { //delete temp file after 15 mins
        tempRef.set(null);
      }, 900000);
    });
  });
};

export = (config: any) => {
  let _config = config || {};

  initPlanAllpay(_config);
};
