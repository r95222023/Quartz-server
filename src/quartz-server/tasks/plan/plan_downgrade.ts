import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import lzString = require('../../components/encoding/lzString');
import planService = require('../../components/plans/plan.service');
let moment = require('moment');

let initPlanAllpay = (config: any) => {
  let genChkOpt = {
      'specId': 'plan_downgrade',
      'numWorkers': config.numWorkers || 10,
      // 'sanitize': false,
      'suppressStack': config.suppressStack || true
    },
    // tempOrderOpt = {
    //   'specId': 'allpay_reg_temp_order',
    //   'numWorkers': config.numWorkers || 10,
    //   'sanitize': false,
    //   'suppressStack': config.suppressStack || true
    // },
    queueRef = firebaseUtil.ref('queue');

  //gen_check_mac
  firebaseUtil.queue(queueRef, genChkOpt, (data: any, progress: any, resolve: any, reject: any) => {
    planService.change(data.siteName, data.plan.changeTo).then((res:any) => {
      let siteName = data.siteName;

      let updateData = {
        processTime: (new Date()).getTime(),
        siteName:siteName,
        pid: data.plan.changeTo,
        startAt:res.plan.startAt,
        endAt:res.plan.endAt
      };
      Promise.all([
        // firebaseUtil.ref('users?type=detail').child('sites/' + siteName + '/pid').update(pid),
        firebaseUtil.ref('users?type=detail').child(data.payer.id).child('bills').push(updateData),
        firebaseUtil.ref('plans?type=sites').child('list').child(siteName).update(updateData)
      ]).then(() => {
        resolve();
      });
    });
  });
};

export = (config: any) => {
  let _config = config || {};

  initPlanAllpay(_config);
};
