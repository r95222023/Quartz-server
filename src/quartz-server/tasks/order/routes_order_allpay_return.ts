let app = require('../../components/expressApp/expressApp.service');
let firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import allpayUtil = require('../../components/payments/allpayUtil');

function index(esc: any, index: string, type: string, id: string, data: any) {
  let req = {
    index: index,
    type: type,
    id: id,
    body: data
  };
  esc.index(req, (error: any, response: any) => {
    if (error) {
      console.error('failed to index', error);
      // errorHandler(error, {code: 'ELASTICSEARCH_INDEX_ADD_ERROR'});
      // reject(error)
    } else {
      console.log('index added', id);
    }
  });
}

function updateOrder(siteName:string, oid: string, paymentData: any, esc: any) {
  return new Promise(function (resolve, reject) {
    firebaseUtil.ref('site-temps?type=order-allpay&siteName=' + siteName).child(oid).once('value', function (snap: any) {
      let orderData = snap.val();
      if (!orderData) reject();
      let pid = orderData.plan.changeTo;
      // var order = new Order(orderData, esc);
      // var uid = orderData.clientInfo.uid;
      //index(esc, 'plan_'+siteName, 'plan_bill', oid, orderData);

      // order.indexOrder();
      let updateData = {
        processTime: (new Date()).getTime(),
        siteName:siteName,
        pid: pid,
        startAt:orderData.plan.startAt,
        endAt:orderData.plan.endAt,
        //desc: getDesc(orderData),
        //totalAmount: getTotal(orderData),
        payment: {
          provider: 'allpay',
          status: paymentData.RtnCode
        }
      };

      Promise.all([
        // firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
        firebaseUtil.ref('users?type=detail').child(orderData.payer.id).child('bills').push(updateData),
        firebaseUtil.ref('plans?type=sites').child('list').child(siteName).update(updateData)
      ]).then(() => {
        snap.ref.set(null);
        resolve();
      });
    });
  });
}

function init(esc: any) {
  let rtnHandler = (req: any, res: any)=> {
    console.log(req.body);
    let paymentData = req.body;
    allpayUtil.getAllpay('plans?type=config/payment/allpay').then((allpay:any)=>{
      if (paymentData.CheckMacValue === allpay.genCheckMacValue(paymentData)) {
        let id = paymentData.MerchantTradeNo;
        updateOrder(req.query.siteName, id, paymentData, esc)
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
