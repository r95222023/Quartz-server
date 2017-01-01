import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import lzString = require('../../components/encoding/lzString');
import orderService = require('../../components/order/order.service');
import allpayUtil = require('../../components/payments/allpayUtil');
import * as _ from 'lodash';


let initOrderAllpay = (config: any) => {
  let genChkOpt = {
      'specId': 'allpay_gen_check_mac',
      'numWorkers': config.numWorkers || 10,
      // 'sanitize': false,
      'suppressStack': config.suppressStack || true
    },
    queueRef = firebaseUtil.ref('queue');

  firebaseUtil.queue(queueRef, genChkOpt, (data: any, progress: any, resolve: any, reject: any) => {
    let siteName = data.siteName;
    let order = new orderService.Order(data);
    //orderService.verify(data).then(...).catch(...)
    order.check().then(() => {
      let params = {
        ReturnURL: "http://131.193.191.5/orderAllpayReceive?sitename=" + siteName,
        PaymentInfoURL: "http://131.193.191.5/orderAllpayPaymentInfo?sitename=" + siteName,
        TotalAmount: order.payment.getTotalAmount()
      };
      //gen_allpay params
      allpayUtil.getAllpay('site-config-payment?provider=allpay&siteName=' + siteName, _.extend(data.payment.allpay, params)).then(function (allpay: any) {
        let id = data.id; // taskId===unique orderId

        let tempRef = firebaseUtil.ref('site-temps?type=order-allpay&siteName=' + siteName).child(allpay.publicParams.MerchantTradeNo);
        tempRef.update(order.orderData).then(()=>{
          return queueRef.child('tasks/' + id + '/payment').update({
            allpay: allpay.publicParams,
            stage: allpay.stage
          });
        }).then(resolve).catch(reject);
        // Promise.all([
        //   queueRef.child('tasks/' + id + '/payment').update({
        //     allpay: allpay.publicParams,
        //     stage: allpay.stage
        //   }),
        //   tempRef.update(order.orderData)
        // ]).then(function () {
        //   resolve();
        // }).catch(reject);
        setTimeout(function () { //delete temp file after 15 mins
          tempRef.set(null);
        }, 900000);
      });
    }).catch(reject);
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

export = (config: any) => {
  let _config = config || {};

  initOrderAllpay(_config);
};
