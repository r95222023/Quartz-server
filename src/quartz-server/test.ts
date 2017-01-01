// var serverService:any = require('./components/server/servers.service');
let app = require('./components/expressApp/expressApp.service');
let esc = require('./components/elasticsearchClient/esc');
let serverService = require('./components/server/servers.service');


import analyticsUtil = require('./components/anlytics/analytics.service');
// analyticsUtil.regOrder('template1',{'pd-001':{quantity:3, price:100}});
// analyticsUtil.regOrder('template1',{totalAmount:30});
// import * as serverService from './components/server/servers.service';
// import * as esc from './components/elasticsearchClient/esc';
// import * as requireDir from 'require-dir';

serverService({}).onReady().then(function (serverId:any) {
  console.log('start server: ' + serverId);

  esc({
    port: 9200,
    ip: "localhost",
    retry: 5
  }).onReady().then(function (esc:any) {
    console.log('elasticsearch found, start loading tasks');
    require('./tasks/plan/plan_allpay')(esc);
    require('./tasks/plan/routes_plan_allpay_return')({});
    require('./tasks/order/order_allpay')(esc);
    require('./tasks/order/routes_order_allpay_return')({});
    // require('./tasks/express_routes/test')();

    require('./tasks/searching/index')(esc);
    require('./tasks/searching/search')(esc);
    // task_queue['search'](esc);
    app.listen(80, () => {
      console.log('App is listening on port:' + 80);
    });
  });



  // require('./tasks/test/test')();
  // app.listen(80, () => {
  //   console.log('App is listening on port:' + 80);
  // });



});
export=()=>{
  console.log('temp')
}
