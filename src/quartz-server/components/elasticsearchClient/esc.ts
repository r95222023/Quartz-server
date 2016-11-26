import * as http from 'http';

let elasticsearch=require('elasticsearch');

function initEs(resolve:any, config:any) {
  let client = new elasticsearch.Client({
    host: config.ip + ":" + config.port/*,
     log: 'trace'*/
  });

  resolve(client);
}

function checkConnection(resolve:any, reject:any, config:any, retry:number) {
  let options = {
    hostname: config.ip,
    port: config.port,
    path: '/'
  };
  http.get(options, function (res:any) {
    initEs(resolve, config);
  }).on('error', function (error:any) {
    if (retry > (config.retry || 3)) {
      reject('Elasticsearch is offline');
    } else {
      console.log('cant find elasticsearch service, attempt to retry:' + retry);
      setTimeout(function () {
        checkConnection(resolve,reject, config, retry++);
      }, 10000)
    }
  });
}


class Esc {
  private promise:any;
  constructor(config:Object){
    this.promise = new Promise((resolve:any,reject:any)=>{
      checkConnection(resolve, reject, config,0);
    })
  }
  onReady(){
    return this.promise
  }
}


export = function(config:any){
  return new Esc(config);
};


