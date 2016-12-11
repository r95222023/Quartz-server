import firebaseUtil = require('../firebaseUtil/firebaseUtil.service');
import lzString = require('../encoding/lzString');
let Allpay = require('allpay');

function getAllpay(path:string) {
  return new Promise((resolve, reject) => {
    firebaseUtil.ref(path).once('value', (paymentParamSnap: any) => {
      let paymentParams = paymentParamSnap.val() || {};
      let publicParams = lzString.decompress(paymentParams.public) || {};
      let privateParams = lzString.decompress(paymentParams.private) || {};
      let allpay = new Allpay({
        // debug: config.ALLPAY.DEBUG,
        merchantID: publicParams.MerchantID,
        hashKey: privateParams.HashKey,
        hashIV: privateParams.HashIV
      });
      allpay.publicParams=publicParams;
      allpay.privateParams=privateParams;
      resolve(allpay);
    }, reject);
  })
}

export = {
  Allpay:Allpay,
  getAllpay:getAllpay
};
