var serverService:any = require('./components/server/servers.service');
var esc = require('./components/elasticsearchClient/esc');
var queue = require('require-dir')('./queue');

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
    queue['index'](esc);
    queue['search'](esc);
  });
});
