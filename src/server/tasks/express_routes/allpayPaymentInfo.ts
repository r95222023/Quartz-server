var app = require('../lib/expressApp'),
  allpay = require('allpay'),
  config = require('../config'),
  firebaseUtil = require('../lib/firebaseUtil');

import {Order} from '../../components/order/order.service'

function init(esc: any) {
  app.post('/allpayPaymentInfo', function (req, res) {
    console.log(req.body);
    var siteName = req.params('sitename'),
      uid = req.params('uid'),
      paymentData = req.body;
    var promise = new Promise(function (resolve, reject) {
      if (validateData(paymentData)) {
        var id = paymentData.MerchantTradeNo;
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
  });
}

function updateOrder(siteName: string, oid: string, paymentData: any, esc: any) {
  return new Promise(function (resolve, reject) {
    firebaseUtil.ref('temps?type=payment&provider=allpay').child(oid).once('value', function (snap) {
      var orderData = snap.val(),
        order = new Order(orderData, esc),
        uid = orderData.clientInfo.uid;

      //index
      order.indexOrder();

      orderData.createTime = (new Date()).getTime();
      orderData.payment = {
        'allpay': paymentData,
        'type': 'allpay',
        'status': 'pending'
      };
      firebaseUtil.ref('site-order?type=detail&siteName=' + siteName + '&id=' + oid).update(orderData);
      //Todo:  remove unnecessary properties in listData
      var orderListData = Object.assign({}, orderData, {payment: null});
      firebaseUtil.ref('user-order?type=list&siteName=' + siteName + '&userId=' + uid + '&id=' + oid).update(orderListData);
      snap.ref.set(null);
      resolve()
    });
  });
}

function updatePayment(siteName, pid, data) {
  return firebaseUtil.ref('site-payment?type=detail&siteName=' + siteName + '&id=' + pid).update(data);
}

function validateData(data) {
  return data['CheckMacValue'] === allpay.genCheckMacValue(data);
}
//
// function updateMain(siteName, data) {
//   delete data.CheckMacValue;
//   var refUrl = config.FBURL + 'sites/detail/' + siteName;
//   updateOrder(refUrl, data);
// }
//
// function updateUser(siteName, uid, data) {
//   var userOrderRefUrl = config.FBURL + '/sites/detail/' + siteName + '/users/detail/' + uid;
//   updateOrder(userOrderRefUrl, data)
// }

// function updateOrder(refUrl, data) {
//     var _data = {};
//     _data['orders/detail/' + data.MerchantTradeNo + '/payment'] = {allpay: data, status: 'pending'};
//     _data['orders/list/' + data.MerchantTradeNo + '/payment'] = {status: 'pending'};
//     firebaseUtil.ref(refUrl).update(_data)
// }

module.exports = init;
