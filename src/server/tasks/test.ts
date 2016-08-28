let serverService:any =require( '../components/server/servers.service');
let esc =require( '../components/elasticsearchClient/esc');


serverService({}).onReady().then(function(serverId:string){
  console.log('start server: ' + serverId);
  esc({
    port: 9200,
    ip: "localhost",
    retry: 5
  }).onReady().then((esc:any)=>{
    console.log('elasticsearch found, start loading tasks');
    require('../queue/search')(esc);
  })
});


