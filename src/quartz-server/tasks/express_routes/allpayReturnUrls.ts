let app = require('../../components/expressApp/expressApp.service'),
    allpay = require('allpay'),
    firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');

import {Order} from '../../components/order/order.service'

function init(esc: any) {
  let rtnHandler = function (req, res) {
        console.log(req.body);
    let siteName = req.params('sitename'),
            paymentData = req.body;
    let promise = new Promise(function (resolve, reject) {
            if (validateData(paymentData)) {
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

    app.post('/allpayPaymentInfo', rtnHandler);
    app.post('/allpayReceive', rtnHandler);
}

function updateOrder(siteName: string, oid: string, paymentData: any, esc: any) {
    return new Promise(function (resolve, reject) {
        firebaseUtil.ref('site-temps?type=order-allpay&siteName='+siteName).child(oid).once('value', function (snap:any) {
          let orderData = snap.val();
          let order = new Order(orderData, esc);
            // var uid = orderData.clientInfo.uid;

            //index: use elasticsearch to store data
            order.indexOrder();

            orderData.createTime = (new Date()).getTime();
            orderData.payment = {
                'allpay': paymentData,
                'type': 'allpay',
                'status': paymentData.RtnCode
            };
            // firebaseUtil.ref('site-order?type=detail&siteName=' + siteName + '&id=' + oid).update(orderData);

            // var orderListData = Object.assign({}, orderData, {payment: null});
            // firebaseUtil.ref('user-order?type=list&siteName=' + siteName + '&userId=' + uid + '&id=' + oid).update(orderListData);
            snap.ref.set(null);
            resolve()
        });
    });
}

function validateData(data:any) {
    return data['CheckMacValue'] === allpay.genCheckMacValue(data);
}

export = init;
