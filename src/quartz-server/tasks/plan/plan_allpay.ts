import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import lzString = require('../../components/encoding/lzString');
import allpayUtil = require('../../components/payments/allpayUtil');
import planService = require('../../components/plans/plan.service');
import * as _ from 'lodash';


let initPlanAllpay = (config: any) => {
  let genChkOpt = {
      'specId': 'plan_allpay_gen_check_mac',
      'numWorkers': config.numWorkers || 10,
      // 'sanitize': false,
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
    let promises = [
      allpayUtil.getAllpay('plans?type=config/payment/allpay'),
      planService.change(data.siteName, data.plan.changeTo)
    ];
    Promise.all(promises).then((res:any) => {
      let allpay: any = res[0];
      let allpayParams = _.extend({}, allpay.publicParams, data.payment.allpay);
      let total:number = Math.round(res[1].payment.total);
      let tempRef = firebaseUtil.ref('plans?type=temp').child(data.id);

      allpayParams.TotalAmount = total;
      allpayParams.CheckMacValue = allpay.genCheckMacValue(allpayParams);

      // data.payment.allpay = allpayParams;
      data.payment.total = total;
      _.extend(data.plan, res[1].plan);
      // _.extend(data.payment, res[1].payment);

      delete data.payment.allpay;
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
