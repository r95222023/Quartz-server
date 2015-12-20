//var config = require('../config');
var firebaseUtil = require('./firebaseUtil'),
    events = require('events'),
    q = require('q'),
    _ = require('lodash');


var serverGroupRefs = {},
    start = new Date(),
    eventEmitter = new events.EventEmitter(),
    serverStat,
    def = q.defer();

function ServerGroup(config) {
    ////get server info
    var sysMonitor = require('./systemMonitor')(config);
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
        if(that.serverId!==oldSnap.key()) {
            serverGroupRefs[oldSnap.key()].off();
            delete serverGroupRefs[oldSnap.key()];
        }
        eventEmitter.emit('child_removed', oldSnap);
    });

    ////register this server
    serverRef.child('online').child(config.SERVER_ID).once('value', function (snap) {
        if (snap.val() === null) {
            serverId = config.SERVER_ID;
            keepOnline(serverId);
        } else {
            that.serverId = 'temp:' + start.getTime();
            console.log('Server ' + config.SERVER_ID + ' already exists.');
            keepOnline(that.serverId, true);
        }
    });

    function keepOnline(serverId, isTemporary) {
        var ref = serverRef.child('online').child(serverId),
            isReconnect=false;
        ref.on('value', function (snap) {
            if(snap.val()===null) {
                regServer(serverId, isTemporary,isReconnect);
                isReconnect=true;
            }
        });
    }

    function regServer(serverId, isTemorary, isReconnect) {
        serverRef.child('online').child(serverId).set({
            startAt: firebaseUtil.ServerValue.TIMESTAMP
        }, function (error) {
            //server is registered now
            if(isReconnect) console.log('reconnected');
            if (error) {
                def.reject(error);
            } else {
                def.resolve(serverId);
            }
        });
        serverRef.child('online').child(serverId).onDisconnect().set(null);

        if (!isTemorary) {
            serverRef.child('offline').child(serverId).set(null);
            serverRef.child('offline').child(serverId).onDisconnect().set({
                lastStartAt: start.getTime(),
                endAt: firebaseUtil.ServerValue.TIMESTAMP
            });
        }

        var sysInfo = sysMonitor.getSysInfo();
        var serverInfo = _.merge(config.SERVER_INFO, sysInfo, {
            status:'online'
        });

        serverRef.child('detail').child(serverId).update(serverInfo);
        if (isTemorary) {
            serverRef.child('detail').child(serverId).onDisconnect().set(null);
        } else {
            serverRef.child('detail').child(serverId).child('status').onDisconnect().set('offline');
        }


        //TODO: use socket.io;
        var stopWatchCPU;
        serverRef.child('detail').child(serverId).child('monitor/cpu/watch').on('value', function (snap) {
            var ref = serverRef.child('detail').child(serverId).child('monitor/cpu/usage'),
                timeouts = {};
            if(snap.val()!==null) {
                var val = snap.val();
                var interval = (val.interval&&typeof val.interval==='number'&&val.interval>500)? val.interval:10000,
                    samples = (val.samples&&typeof val.samples==='number'&&val.samples>20)? val.samples:10000*60;

                stopWatchCPU = sysMonitor.monitorCpuUsage(function (cpuUsage) {
                    var now = (new Date()).getTime();
                    ref.child(now);
                    ref.child(now).set(cpuUsage);
                    timeouts[now] = setTimeout(function () {
                        delete timeouts[now];
                        ref.child(now).set(null);
                    }, samples*interval);
                }, interval);
            } else {
                if(stopWatchCPU) {
                    stopWatchCPU();
                    for(var key in timeouts){
                        clearTimeout(timeouts[key]);
                    }
                    ref.set(null);
                }
            }
        })
    }

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
    if (listner) {
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

ServerGroup.prototype.getReadyPromise = function () {
    return def.promise;
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