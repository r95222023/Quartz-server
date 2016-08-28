//var config = require('../config');
var fbUtil = require('../firebaseUtil/firebaseUtil.service'),
  os = require('os'),
  events = require('events'),
  q = require('q'),
  _ = require('lodash');


let serverGroupRefs: any = {},
  start = new Date(),
  eventEmitter = new events.EventEmitter();

class ServerService {
  private serverRef: any;
  private def: any;
  serverId: string;
  serverInfo: any;
  stat: any;

  constructor(config: Object) {
    var serverRef = fbUtil.ref('servers', {}),
      onlineServerRef = serverRef.child('online'),
      self = this;

    this.serverRef = serverRef;
    this.def = q.defer();
    this.serverId = fbUtil.formalizeKey(os.hostname());
    this.serverInfo = {
      arch: os.arch(),
      cpus: os.cpus(),
      networkInterfaces: fbUtil.formalizeData(os.networkInterfaces()),
      freemem: os.freemem() + ' bytes',
      totalmem: os.totalmem() + ' bytes',
      platform: os.platform(),
      hostname: this.serverId,
      status: 'online'
    };

    onlineServerRef.on('value', (snap: any)=> {
      //on(xxx, onComplete) 只要執行就會先跑一次onComeplete不管遠端資料是不是真的傳進來
      self.stat = _.merge(self.stat || {}, getOnlineStat(snap));
      eventEmitter.emit('value', snap)
    });

    onlineServerRef.on('child_added', (snap: any)=> {
      serverGroupRefs[snap.key] = snap.ref;
      eventEmitter.emit('child_added', snap);
    });

    onlineServerRef.on('child_removed', (oldSnap: any)=> {
      if (self.serverId !== oldSnap.key) {
        serverGroupRefs[oldSnap.key].off();
        delete serverGroupRefs[oldSnap.key];
      }
      eventEmitter.emit('child_removed', oldSnap);
    });
    this.keepOnline(this.serverId);
  }

  keepOnline(serverId: string) {
    var ref = this.serverRef.child('online').child(serverId),
      isReconnect = false;
    ref.on('value', (snap: any)=> {
      if (snap.val() === null) {
        this.regServer(serverId, isReconnect);
        isReconnect = true;
      }
    });
  }

  regServer(serverId: string, isReconnect: boolean) {
    var serverRef = this.serverRef;
    serverRef.child('online').child(serverId).set({
      startAt: fbUtil.ServerValue.TIMESTAMP
    }, (error: any)=> {
      //server is registered now
      if (isReconnect) console.log('reconnected');
      if (error) {
        this.def.reject(error);
      } else {
        this.def.resolve(serverId);
      }
    });
    serverRef.child('online').child(serverId).onDisconnect().set(null);


    serverRef.child('offline').child(serverId).set(null);
    serverRef.child('offline').child(serverId).onDisconnect().set({
      lastStartAt: start.getTime(),
      endAt: fbUtil.ServerValue.TIMESTAMP
    });

    serverRef.child('detail').child(serverId).update(this.serverInfo);
    serverRef.child('detail').child(serverId).child('status').onDisconnect().set('offline');
  };

  on(event: string, listener: any) {
    eventEmitter.on(event, listener);
  };

  once(event: string, listener: any) {
    eventEmitter.once(event, listener);
  };

  off(event: string, listener: any) {
    if (listener) {
      eventEmitter.removeListener(event, listener);
    } else {
      eventEmitter.removeAllListeners(event);
    }
  };

  onReady() {
    return this.def.promise;
  };
}


////////
function getOnlineStat(snap: any) {
  var serverSnap = snap.val(),
    serverOnline = 0;
  for (var onlineServerName in serverSnap) {
    serverOnline++;
    //for future online server stat
  }

  return {
    serverOnline: serverOnline
  };
}


module.exports = function (config: Object) {
  return new ServerService(config);
};
