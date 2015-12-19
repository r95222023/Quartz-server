//var config = require('../config');
var firebaseUtil = require('./firebaseUtil'),
    events = require('events'),
    os = require('os'),
    _ = require('lodash');



var serverGroupRefs = {},
    start = new Date(),
    eventEmitter = new events.EventEmitter(),
    serverStat;
function ServerGroup(config) {
    ////get server info
    var serverRef = firebaseUtil.ref(config.FBURL + config.SERVER_PATH);
    var onlineServerRef = serverRef.child('online'),
        that = this;

    this.serverRef = serverRef;
    this.serverId = config.SERVER_ID;

    onlineServerRef.on('value', function (snap) {
        //on(xxx, onComplete) 只要執行就會先跑一次onComeplete不管遠端資料是不是真的傳進來
        that.stat = _.merge(that.stat || {}, getOnlineStat(snap));
        eventEmitter.emit('value', snap)
    });

    onlineServerRef.on('child_added', function (snap) {
        serverGroupRefs[snap.key()] = snap.ref();
        eventEmitter.emit('child_added', snap);
    });

    onlineServerRef.on('child_removed', function (oldSnap) {
        serverGroupRefs[oldSnap.key()].off();
        eventEmitter.emit('child_removed', oldSnap);
    });

    ////register this server
    serverRef.child('online').child(config.SERVER_ID).transaction(function (currentData) {
        if(currentData===null){
            return {
                startAt: firebaseUtil.ServerValue.TIMESTAMP
            }
        } else {
            console.log('Server '+config.SERVER_ID+' already exists.');
        }
    });
    serverRef.child('online').child(config.SERVER_ID).onDisconnect().set(null);

    serverRef.child('offline').child(config.SERVER_ID).set(null);
    serverRef.child('offline').child(config.SERVER_ID).onDisconnect().set({
        lastStartAt: start.getTime(),
        endAt: firebaseUtil.ServerValue.TIMESTAMP
    });

    var sysInfo={
        arch: os.arch(),
        cpus: os.cpus(),
        freemem: os.freemem()+' bytes',
        totalmem: os.totalmem()+' bytes',
        platform: os.platform()
    };
    var serverInfo = _.merge(config.SERVER_INFO, sysInfo);
    serverRef.child('detail').child(config.SERVER_ID).update(serverInfo);
}

ServerGroup.prototype.getServerRefs = function () {
    return serverGroupRefs;
};

ServerGroup.prototype.on = function (event, listener) {
    eventEmitter.on(event, listener);
};

ServerGroup.prototype.once = function (event, listener) {
    eventEmitter.once(event, listener);
};

ServerGroup.prototype.off = function (event, listener) {
    if (!listner) {
        eventEmitter.removeListener(event, listener);
    } else {
        eventEmitter.removeAllListeners(event);
    }
};

ServerGroup.prototype.getThisServerRef = function (onlineOrOffline) {
    return this.serverRef.child(onlineOrOffline || 'online').child(this.serverId)
};

ServerGroup.prototype.getStat = function () {
    return this.stat;
};


////////
function getOnlineStat(snap) {
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


module.exports = function (config) {
    return new ServerGroup(config);
};