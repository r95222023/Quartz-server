let app = require('../../components/expressApp/expressApp.service');
let firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import allpayUtil = require('../../components/payments/allpayUtil');
import analyticsUtil = require('../../components/anlytics/analytics.service');

// function index(esc: any, index: string, type: string, id: string, data: any) {
//   let req = {
//     index: index,
//     type: type,
//     id: id,
//     body: data
//   };
//   esc.index(req, (error: any, response: any) => {
//     if (error) {
//       console.error('failed to index', error);
//       // errorHandler(error, {code: 'ELASTICSEARCH_INDEX_ADD_ERROR'});
//       // reject(error)
//     } else {
//       console.log('index added', id);
//     }
//   });
// }

function updateOrder(siteName:string, oid: string, paymentData: any, esc: any) {

  let escreq ={
    index:siteName,
    type: 'order-temp',
    id: oid
  };
  return esc.get(escreq).then((res:any)=>{
    let orderData = res['_source'];
    let indexreq = {
      index: siteName,
      type: 'order',
      id: oid,
      body:orderData
    };
    return Promise.all([
      // firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
      // firebaseUtil.ref('site-users?type=detail&siteName='+siteName).child(orderData.buyer.id).child('orders').push(orderData),
      // firebaseUtil.ref('site-orders?type=detail'+siteName).update(orderData),
      esc.index(indexreq),
      analyticsUtil.regOrder(siteName, orderData),
      analyticsUtil.regProduct(siteName, orderData.items),
    ]).then(() => {
      return esc.delete(escreq);
    });
  });
  //
  // return firebaseUtil.ref('site-temps?type=order-allpay&siteName=' + siteName).child(oid).once('value').then((snap: any)=>{
  //   let orderData = snap.val();
  //   //index(esc, 'plan_'+siteName, 'plan_bill', oid, orderData);
  //   // order.indexOrder();
  //
  //   return Promise.all([
  //     // firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
  //     firebaseUtil.ref('site-users?type=detail&siteName='+siteName).child(orderData.buyer.id).child('orders').push(orderData),
  //     firebaseUtil.ref('site-orders?type=detail'+siteName).update(orderData),
  //     analyticsUtil.regOrder(siteName, orderData),
  //     analyticsUtil.regProduct(siteName, orderData.items),
  //   ]).then(() => {
  //     return snap.ref.set(null);
  //   });
  // });
}

function init(esc: any) {
  let rtnHandler = (req: any, res: any)=> {
    console.log(req.body);
    let paymentData = req.body;
    allpayUtil.getAllpay('plans?type=config/payment/allpay').then((allpay:any)=>{
      if (paymentData.CheckMacValue === allpay.genCheckMacValue(paymentData)) {
        let id = paymentData.MerchantTradeNo;
        updateOrder(req.query.sitename, id, paymentData, esc)
          .then(()=> {
            res.status(200).send('1|OK');
          });
      } else {
        console.log('invalid order detected:' + JSON.stringify(paymentData));
      }
    });
  };

  app.post('/orderAllpayReceive', rtnHandler);
}


export = init;
