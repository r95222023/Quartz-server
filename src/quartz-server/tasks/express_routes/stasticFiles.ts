let app = require('../../components/expressApp/expressApp.service');
let express = require('express');
let path = require('path');

function init(config:any){
  let root = path.resolve(__dirname,'../../');
  let appDir = path.resolve(root,'/apps');
  app.use(appDir, express.static('apps'));
}

export= init;
