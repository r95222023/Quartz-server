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
    queueRef = firebaseUtil.ref('queue');

  firebaseUtil.queue(queueRef, genChkOpt, (data: any, progress: any, resolve: any, reject: any) => {
    planService.change(data.siteName, data.plan.changeTo).then((res:any)=>{
      let total:number = Math.round(res.payment.total);
      let params={
        ReturnURL: "http://131.193.191.1/planAllpayReceive?sitename=" + data.siteName,
        TotalAmount:total
      };
      //gen_allpay params
      allpayUtil.getAllpay('plans?type=config/payment/allpay', _.extend(params, data.payment.allpay))
        .then((allpay:any)=>{
          let allpayParams = allpay.publicParams;
          let tempRef = firebaseUtil.ref('plans?type=temp').child(data.id);

          // data.payment.allpay = allpayParams;
          data.payment.total = total;
          _.extend(data.plan, res.plan);
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
        })
    });
  });
};

export = (config: any) => {
  let _config = config || {};

  initPlanAllpay(_config);
};
