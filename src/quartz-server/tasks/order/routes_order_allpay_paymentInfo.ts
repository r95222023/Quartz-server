let app = require('../../components/expressApp/expressApp.service');
let firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
// import allpayUtil = require('../../components/payments/allpayUtil');
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

// function updateOrder(siteName:string, oid: string, paymentData: any) {
//   return firebaseUtil.ref('site-temps?type=order-allpay&siteName=' + siteName).child(oid).child('payment/info').update(paymentData)
// }

function init() {
  let rtnHandler = (req: any, res: any)=> {
    console.log(req.body);
    let paymentData = req.body;
    let id = paymentData.MerchantTradeNo;
    let siteName= req.query.sitename;


    let escreq ={
      index:siteName,
      type: 'order-temp',
      id: id,
      body:{
        doc:{
          'paymen.info':paymentData
        }
      }
    };
    esc.index(escreq, (error: any, response: any) => {
      if (error) {
        console.error('failed to update the index: order-temp:'+siteName+':'+id, error);
        // reject(error)
      } else {
        console.log('index updated', escreq.index, siteName, id);
        res.status(200).send('1|OK');
      }
    });
    //
    // updateOrder(req.query.sitename, id, paymentData)
    //   .then(()=> {
    //     res.status(200).send('1|OK');
    //   });


    // allpayUtil.getAllpay('plans?type=config/payment/allpay').then((allpay:any)=>{
    //   if (paymentData.CheckMacValue === allpay.genCheckMacValue(paymentData)) {
    //     let id = paymentData.MerchantTradeNo;
    //     updateOrder(req.query.sitename, id, paymentData, esc)
    //       .then(()=> {
    //         res.status(200).send('1|OK');
    //       });
    //   } else {
    //     console.log('invalid order detected:' + JSON.stringify(paymentData));
    //   }
    // });
  };
  app.post('/orderAllpayPaymentInfo', rtnHandler);
}


export = init;
