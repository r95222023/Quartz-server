import firebaseUtil = require('../firebaseUtil/firebaseUtil.service');
import lzString = require('../encoding/lzString');
let moment = require('moment');

function changePlan(siteName: string, changeTo: any) {
  return new Promise((resolve, reject) => {
    Promise.all([
      firebaseUtil.ref('plans?type=list').once('value'),
      firebaseUtil.ref('plans?type=sites').child('list').child(siteName).once('value')
    ]).then((res: any) => {
      let plans = res[0].val();
      let sitePlan = res[1].val() || {};
      let currentPlan = plans[sitePlan.pid || 'p1'];
      let toPlan = plans[changeTo];

      let periods: any = {M: [1, 'months']};

      let result: any;
      if (changeTo === 'p1') {
        result = {
          plan: {
            type: 'free',
          },
          payment:{
            total:0
          }
        }
      } else if (currentPlan.pid === changeTo) {
        let period = periods[currentPlan.period];
        let startAt = moment(sitePlan.endAt).valueOf();
        let endAt = moment(startAt).add(period[0], period[1]).valueOf();

        result = {
          plan: {
            startAt: startAt,
            endAt: endAt,
            type: 'refill',
          },
          payment:{
            total:toPlan.price
          }
        }

      } else if (currentPlan.pid < changeTo) {
        let period = periods[currentPlan.period];
        let startAt = moment().valueOf();
        let endAt = moment(startAt).add(period[0], period[1]).valueOf();
        let refund = currentPlan.price * (moment().unix() - moment(sitePlan.endAt).unix()) / moment.duration(period[0], period[1]).asSeconds();
        result = {
          plan: {
            startAt: startAt,
            endAt: endAt,
            type: 'upgrade',
          },
          payment:{
            total: toPlan.price - refund
          }
        }
      } else {
        let period = periods[toPlan.period];
        let startAt = moment(sitePlan.endAt).valueOf();
        let endAt = moment(startAt).add(period[0], period[1]).valueOf();

        result = {
          plan: {
            startAt: startAt,
            endAt: endAt,
            type: 'downgrade',
          },
          payment:{
            total: 0
          }
        }
      }
      resolve(result);
    });
  })
}

export = {
  change: changePlan
};
