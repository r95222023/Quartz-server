import * as http from 'http';
import * as q from 'q';

let elasticsearch=require('elasticsearch');

function initEs(def:any, config:any) {
  let client = new elasticsearch.Client({
    host: config.ip + ":" + config.port/*,
     log: 'trace'*/
  });

  def.resolve(client);
}

function checkConnection(def:any, config:any, retry:number) {
  let options = {
    hostname: config.ip,
    port: config.port,
    path: '/'
  };
  http.get(options, function (res:any) {
    initEs(def, config);
  }).on('error', function (error:any) {
    if (retry > (config.retry || 3)) {
      def.reject('Elasticsearch is offline');
    } else {
      console.log('cant find elasticsearch service, attempt to retry:' + retry);
      setTimeout(function () {
        checkConnection(def, config, retry++)
      }, 10000)
    }
  });
  return def.promise;
}


class Esc {
  private def:any;
  constructor(config:Object){
    this.def = q.defer();
    checkConnection(this.def, config,0);
  }
  onReady(){
    return this.def.promise
  }
}


export = function(config:any){
  return new Esc(config);
};


