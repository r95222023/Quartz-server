let app = require('../../components/expressApp/expressApp.service');

function init() {
  let rtnHandler = function (req: any, res: any) {
    console.log(req);
  };

  app.post('/test', rtnHandler);
}

export = init;
