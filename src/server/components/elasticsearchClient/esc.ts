var elasticsearch = require('elasticsearch'),
  http = require('http'),
  // net = require('net'),
  q = require('q'),
  events = require('events');

function initEs(def:any, config:any) {
  var client = new elasticsearch.Client({
    host: config.ip + ":" + config.port/*,
     log: 'trace'*/
  });

  def.resolve(client);
}

function checkConnection(def:any, config:any, retry:number) {
  var options = {
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


module.exports = function(config:any){
  return new Esc(config);
};


