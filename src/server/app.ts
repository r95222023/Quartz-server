// var serverService:any = require('./components/server/servers.service');
var esc = require('./components/elasticsearchClient/esc');
var task_queue = require('require-dir')('./tasks/queue');
var serverService = require('./components/server/servers.service');

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
    task_queue['index'](esc);
    task_queue['search'](esc);
  });
});
