var firebaseUtil = require('../components/firebaseUtil/firebaseUtil.service'),
  util = require('../components/utils/util'),
  orderService = require('../components/orderService');

let initStripe = (config: any) => {
  var options = {
      'specId': 'order_validate_stripe',
      'numWorkers': config.numWorkers || 10,
      'sanitize': false,
      'suppressStack': config.suppressStack || true
    },
    rootRef = firebaseUtil.ref('queue');
  var queue = firebaseUtil.queue(rootRef, options, function (data: any, progress: any, resolve: any, reject: any) {
    var os = orderService(data);

    if (!os.isValid()) {
      resolve();
      return;
    }

    rootRef.root.child('sites/' + data.siteName + '/config/payment/' + data.payment.type).once('value', function (paymentParamSnap: any) {
      var paymentParams = paymentParamSnap.val() || {},
        publicParams = paymentParams.public || {},
        privateParams = paymentParams.private || {};

      os.add(data)
        .then(os.charge)
        .then(resolve);
    });
  });
};


module.exports = (config: any) => {
  var _config = config || {};
  initStripe(_config);
};
