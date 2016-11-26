let app = require('../../components/expressApp/expressApp.service'),
  allpay = require('allpay'),
  firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service'),
  plans = require('../../data/plans.data');

import {Order} from '../../components/order/order.service'

function init(esc: any) {
  let rtnHandler = function (req: any, res: any) {
    console.log(req.body);
    let siteName = req.params('sitename'),
      paymentData = req.body;
    let promise = new Promise(function (resolve, reject) {
      if (paymentData.CheckMacValue === allpay.genCheckMacValue(paymentData)) {
        let id = paymentData.MerchantTradeNo;
        updateOrder(siteName, id, paymentData, esc)
          .then(function () {
            resolve();
          })
      } else {
        console.log('invalid order detected:' + JSON.stringify(paymentData));
        resolve();
      }
    });

    promise.then(function () {
      res.status(200).send('1|OK');
    });
  };

  app.post('/planAllpayReceive', rtnHandler);
}

function updateOrder(siteName: string, oid: string, paymentData: any, esc: any) {
  return new Promise(function (resolve, reject) {

    firebaseUtil.ref('plans?type=temp').child(oid).once('value', function (snap: any) {
      let orderData = snap.val();
      if (!orderData) reject();
      let pid = orderData.pid;
      // var order = new Order(orderData, esc);
      // var uid = orderData.clientInfo.uid;
      // todo: index: use elasticsearch to store data
      // order.indexOrder();
      let updateData = {
        processTime: (new Date()).getTime(),
        pid: pid,
        payment: {
          provider: 'allpay',
          status: paymentData.RtnCode
        }
      };

      Promise.all([
        firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
        firebaseUtil.ref('plans?type=sites').child('detail').child(siteName).child('payment/history').push(paymentData),
        firebaseUtil.ref('plans?type=sites').child('list').child(siteName).update(updateData)
      ]).then(() => {
        snap.ref.set(null);
        resolve();
      });
    });
  });
}

export = init;
