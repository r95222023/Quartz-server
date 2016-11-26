import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
// import emitter = require('../../components/emitter/emitter');
// import errorHandler = require('../../components/errorHandler/errorHandler.service');

let initTest = (esc: any, config?: any) => {
  let _config = config || {},
    options = {
      'specId': 'test',
      'numWorkers': _config.numWorkers || 10,
      'sanitize': _config.sanitize || false,
      'suppressStack': _config.suppressStack || true
    },
    rootRef = firebaseUtil.ref('queue');

  let queue = firebaseUtil.queue(rootRef, options, (data: any, progress: any, resolve: any, reject: any) => {
    console.log(data, process);
    setTimeout(()=>{
      resolve();
    },5000);
  });
};

export = initTest;
