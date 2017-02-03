import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import cordova = require('../../components/cordova/cordova.service');
const fs = require('fs');
const path = require('path');


function build(data: any) {
  let appName = data.siteName || 'test3';
  let appsPath = path.resolve(__dirname, '../../files/apps');
  let appPath = path.resolve(__dirname, '../../files/apps', appName);
  let tmpPath = path.resolve(__dirname, '../../files/templates/cordova/app1');
  let plugins: any =[];

  data.plugins= data.plugins||[];
  for (let key in data.plugins) {
    plugins[key] = data.plugins[key]
  }

  return cordova.createApp(appName, tmpPath, {cwd: appsPath})
    .then(() => {
      return cordova.addPlugins(plugins, {cwd: appPath})
    })
    .then(() => {
      return cordova.addPlatform('android', {cwd: appPath});
    })
    .then(() => {
      return cordova.build('android', {cwd: appPath});
    });
}

let init = (config: any) => {
  let queueopt = {
      'specId': 'app_build',
      'numWorkers': config.numWorkers || 10,
      // 'sanitize': false,
      'suppressStack': config.suppressStack || true
    },
    queueRef = firebaseUtil.ref('queue');

  firebaseUtil.queue(queueRef, queueopt, (data: any, progress: any, resolve: any, reject: any) => {
    build(data).then(resolve);
  });
};

export = (config: any) => {
  let _config = config || {};

  init(_config);
};
