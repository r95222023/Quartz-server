import cordova = require('./components/cordova/cordova.service');
const fs = require('fs');
const path = require('path');

let appName = 'test3';
let appsPath = path.resolve(__dirname, 'files/apps');
let appPath = path.resolve(__dirname, 'files/apps', appName);
let tmpPath = path.resolve(__dirname, 'files/templates/cordova/app1');
let plugins: any[] = ['cordova-plugin-camera', 'cordova-plugin-nativestorage'];


cordova.createApp(appName, tmpPath, {cwd: appsPath})
  .then(() => {
    return cordova.addPlugins(plugins, {cwd: appPath})
  })
  .then(() => {
    return cordova.addPlatform('android', {cwd: appPath});
  })
  .then(() => {
    return cordova.build('android', {cwd: appPath});
  });
