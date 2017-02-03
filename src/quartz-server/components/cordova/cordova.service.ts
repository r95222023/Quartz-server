import firebaseUtil = require('../firebaseUtil/firebaseUtil.service');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

// function test(cwd:string) {
//   let p =exec('ls', [/*'-lh', '/usr'*/],{cwd:cwd});
//   p.stdout.on('data', (data:string) => {
//     console.log(`stdout: ${data}`);
//   });
//   return new Promise((resolve: any, reject: any) => {
//     p.on('close', resolve);
//   })
// }

function createApp(appName: string, tmpPath:string, options: any) {
  return new Promise((resolve: any, reject: any) => {
    let command = 'cordova create '+ appName+' org.apache.cordova.app '+appName;
    if(tmpPath) command+=' --template '+ tmpPath;
    let e = exec(
      command,
      options||{}
    );
    e.stdout.on('data', function (stdout:string) {
      console.log(`stdout: ${stdout}`);
    });
    e.stderr.on('data', function (stdout:string) {
      console.log(`stdout: ${stdout}`);
    });
    e.on('close', (code:string) => {
      resolve();
      console.log(`child process exited with code ${code}`);
    });
  })
}

function addPlugins(plugins: any[], options: any) {
  return new Promise((resolve: any, reject: any) => {
    let index = 0;
    function next(){
      if(index===plugins.length){
        resolve()
      } else{
        let plugin = plugins[index];
        index++;
        let p = exec(
          'cordova plugin add '+plugin+' --save',
          options || {}
        );
        p.stdout.on('data', (data:string) => {
          console.log(`stdout: ${data}`);
        });
        p.on('close', next);
      }
    }
    next();
  })
}

function setConfig(path:string, configStr:string){
  return new Promise((resolve:any, reject:any)=>{
    fs.writeFile(path, configStr, (err:any)=>{
      if(err) {
        console.error(err);
        reject(err);
      } else {
        resolve();
      }
    })
  });
}

function addPlatform(platform: string, options: any) {
  return new Promise((resolve: any, reject: any) => {
    let p = exec(
      'cordova platform add '+platform+' --save',
      options || {}
    );
    p.stdout.on('data', (data:string) => {
      console.log(`stdout: ${data}`);
    });
    p.on('close', resolve);
  })
}

function build(platform: string, options: any) {
  return new Promise((resolve: any, reject: any) => {
    let p = exec(
      'cordova build '+platform+' --verbose',
      options || {}
    );
    p.stdout.on('data', (data:string) => {
      console.log(`stdout: ${data}`);
    });
    p.on('close', resolve);
  })
}

export = {
  createApp:createApp,
  addPlugins:addPlugins,
  setConfig:setConfig,
  addPlatform:addPlatform,
  build:build
};
