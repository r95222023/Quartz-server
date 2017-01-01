import firebaseUtil = require('../firebaseUtil/firebaseUtil.service');
import lzString = require('../encoding/lzString');
import moment = require('moment');
import * as _ from 'lodash';

let Allpay = require('allpay');

function getAllpay(path:string, optParams?:any) {
  return new Promise((resolve, reject) => {
    firebaseUtil.ref(path).once('value', (paymentParamSnap: any) => {
      let paymentParams = paymentParamSnap.val() || {};
      let publicParams = lzString.decompress(paymentParams.public) || {};
      let privateParams = lzString.decompress(paymentParams.private) || {};
      publicParams.MerchantID = publicParams.MerchantID||'2000132';
      publicParams.ChoosePayment = publicParams.ChoosePayment||'ALL';
      publicParams.TradeDesc = publicParams.TradeDesc||'No description';

      let allpay = new Allpay({
        // debug: config.ALLPAY.DEBUG,
        merchantID: publicParams.MerchantID,
        hashKey: privateParams.HashKey||'5294y06JbISpM5x9',
        hashIV: privateParams.HashIV||'v77hoKGq4kWxNNIS'
      });

      publicParams.MerchantTradeDate =moment().format('YYYY/MM/DD HH:mm:ss');
      _.extend(publicParams, optParams);

      publicParams.CheckMacValue=allpay.genCheckMacValue(publicParams);
      allpay.publicParams=publicParams;
      allpay.privateParams=privateParams;
      allpay.stage = publicParams.MerchantID==='2000132'||!!privateParams.stage;
      console.log(allpay);
      resolve(allpay);
    }, reject);
  })
}

export = {
  Allpay:Allpay,
  getAllpay:getAllpay
};
