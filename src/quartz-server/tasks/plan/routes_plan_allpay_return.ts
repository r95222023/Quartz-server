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

function updateOrder(oid: string, paymentData: any, esc: any) {
  return new Promise(function (resolve, reject) {
    firebaseUtil.ref('plans?type=temp').child(oid).once('value', function (snap: any) {
      let planData = snap.val();
      if (!planData) reject();
      let pid = planData.plan.changeTo;
      let siteName = planData.siteName;
      // var order = new Order(orderData, esc);
      // var uid = orderData.clientInfo.uid;
      //index(esc, 'plan_'+siteName, 'plan_bill', oid, orderData);

      // order.indexOrder();
      let updateData = {
        processTime: (new Date()).getTime(),
        siteName:siteName,
        pid: pid,
        startAt:planData.plan.startAt,
        endAt:planData.plan.endAt,
        //desc: getDesc(orderData),
        //totalAmount: getTotal(orderData),
        payment: {
          provider: 'allpay',
          status: paymentData.RtnCode
        }
      };

      Promise.all([
        // firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
        firebaseUtil.ref('users?type=detail').child(planData.payer.id).child('bills').push(updateData),
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
        updateOrder(id, paymentData, esc)
          .then(()=> {
            res.status(200).send('1|OK');
          });
      } else {
        console.log('invalid order detected:' + JSON.stringify(paymentData));
      }
    });
  };

  app.post('/planAllpayReceive', rtnHandler);
}


export = init;
