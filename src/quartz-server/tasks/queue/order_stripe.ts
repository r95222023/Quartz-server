import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import util = require('../../components/utils/util');
import orderService = require('../../components/order/order.service');

let initStripe = (config: any) => {
  let options = {
      'specId': 'order_validate_stripe',
      'numWorkers': config.numWorkers || 10,
      'sanitize': false,
      'suppressStack': config.suppressStack || true
    },
    rootRef = firebaseUtil.ref('queue');
  let queue = firebaseUtil.queue(rootRef, options, function (data: any, progress: any, resolve: any, reject: any) {
    let os = new orderService.Order(data);

    if (os.orderData.totalAmount!==data.totalAmount) {
      resolve();
      return;
    }

    rootRef.root.child('sites/' + data.siteName + '/config/payment/' + data.payment.type).once('value', function (paymentParamSnap: any) {
      let paymentParams = paymentParamSnap.val() || {},
        publicParams = paymentParams.public || {},
        privateParams = paymentParams.private || {};

      // os.add(data)
      //   .then(os.charge)
      //   .then(resolve);
    });
  });
};


module.exports = (config: any) => {
  let _config = config || {};
  initStripe(_config);
};
