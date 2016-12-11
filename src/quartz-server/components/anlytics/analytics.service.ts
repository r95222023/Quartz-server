import firebaseUtil = require('../firebaseUtil/firebaseUtil.service');
import moment = require("moment");
import * as _ from 'lodash';

function regOrder(siteName: string, order:any) {
  //s:sales, i:incomes, cs = cumulative sales, g = gross (cumulative income)
  let now =moment();
  let day = now.format('YYMMDD');
  let orderAnalyticsRef: any = firebaseUtil.ref('site-orders?siteName=' + siteName + '&type=analytics');

  return orderAnalyticsRef.child('summary').transaction((current:any)=> {
    let res: any = current || {cs: 0, g: 0};
    res.cs += 1;
    res.g += order.totalAmount;
    return res;
  }).then((committed:boolean, summarySnap:any)=> {
    //update order per day
    return orderAnalyticsRef.child('days/' + day)
      .transaction((current:any)=> {
        let res: any = current || {s: 0, i: 0, cs: 0, g: 0}; //s:sales, i:incomes, cs = cumulative sales, g = gross (cumulative income)
        let summary: any = summarySnap.val();
        res.s += 1;
        res.cs = summary.cs;
        res.g = summary.g;
        res.i += order.totalAmount;
        return res;
      });
  }).then(()=>{
    //remove obsolete data
    return orderAnalyticsRef.child('days').orderByKey().endAt(now.subtract(1,'years').format('YYMMDD')).once('child_added', (snap:any)=> {
      snap.ref.set(null);
    });
  });
}

function regProduct(siteName: string, items:any) {
  //s:sales, i:incomes, cs = cumulative sales, g = gross (cumulative income)
  let now = moment();
  let promises:any=[];
  _.forEach(items, (item, itemId)=>{
    for (let i = 0; i < 30; i++) {
      let day:any=now.add(1,'days').format('YYMMDD'); //register the number of item sold to next 30 days summary = how many item sold within last 30 days
      promises.push(
        firebaseUtil.ref('products?type=analytics&siteName=' + siteName).child('days').child(day).child(itemId)
          .transaction((currentRec:any)=>{
            if(currentRec){
              return {s: currentRec.s+item.quantity}
            } else{
              return {s:item.quantity}
            }
          })
      )
    }
  });
  return Promise.all(promises);
}

export = {
  regProduct: regProduct,
  regOrder: regOrder
};
