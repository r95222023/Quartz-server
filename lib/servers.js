//var config = require('../config');
var firebaseUtil = require('./firebaseUtil'),
    events = require('events'),
    q = require('q'),
    _ = require('lodash'),
    gerneralConfig = require('../config');


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
        self = this;

    this.serverRef = serverRef;
    this.serverId = sysMonitor.getSysInfo().hostname;

    onlineServerRef.on('value', function (snap) {
        //on(xxx, onComplete) 只要執行就會先跑一次onComeplete不管遠端資料是不是真的傳進來
        self.stat = _.merge(self.stat || {}, getOnlineStat(snap));
        eventEmitter.emit('value', snap)
    });

    onlineServerRef.on('child_added', function (snap) {
        serverGroupRefs[snap.key()] = snap.ref();
        eventEmitter.emit('child_added', snap);
    });

    onlineServerRef.on('child_removed', function (oldSnap) {
        if (self.serverId !== oldSnap.key()) {
            serverGroupRefs[oldSnap.key()].off();
            delete serverGroupRefs[oldSnap.key()];
        }
        eventEmitter.emit('child_removed', oldSnap);
    });

    ////register this server
    if (config.SERVER_INFO && config.SERVER_INFO.isTemporary) var isTemp = true;
    keepOnline(self.serverId, isTemp);


    function keepOnline(serverId, isTemporary) {
        var ref = serverRef.child('online').child(serverId),
            isReconnect = false;
        ref.on('value', function (snap) {
            if (snap.val() === null) {
                regServer(serverId, isTemporary, isReconnect);
                isReconnect = true;
            }
        });
    }

    function regServer(serverId, isTemorary, isReconnect) {
        serverRef.child('online').child(serverId).set({
            startAt: firebaseUtil.ServerValue.TIMESTAMP
        }, function (error) {
            //server is registered now
            if (isReconnect) console.log('reconnected');
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
        var serverInfo = _.merge(config.SERVER_INFO, sysInfo);
        serverInfo = _.merge(serverInfo, {
            status: 'online'
        });

        serverRef.child('detail').child(serverId).update(serverInfo);
        if (isTemorary) {
            serverRef.child('detail').child(serverId).onDisconnect().set(null);
        } else {
            serverRef.child('detail').child(serverId).child('status').onDisconnect().set('offline');
        }
    }

    ///// init monitors
    var serverInfo = config.SERVER_INFO || {},
        serverMonitorRefUrl = serverInfo.serverMonitorRefUrl ? (serverInfo.serverMonitorRefUrl + '/' + this.serverId) : (gerneralConfig.FBURL + gerneralConfig.SERVER_PATH + '/' + this.serverId + '/monitor'),
        monitors = config.SERVER_INFO.monitors || {};
    _.forEach(monitors, function (monitor, type) {
        var monitorName = 'get' + _.capitalize(type.toLowerCase()) + 'Usage';
        self.monitor(serverMonitorRefUrl + '/' + type, sysMonitor[monitorName], monitor);
    });
}


ServerGroup.prototype.monitor = function (monitorRefUrl, getDataFunc, opt) {
//TODO: use socket.io;
    var timer,
        stoper = function () {
            if (timer) clearInterval(timer);
            timer = null;
        };
    var monitorRef = firebaseUtil.ref(monitorRefUrl);
    monitorRef.onDisconnect().set(null);

    function start(opt) {
        var usageRef = monitorRef.child('usage'),
            timeouts = {};

        usageRef.set(null);
        var interval = (_.isNumber(opt.interval) && opt.interval > 500) ? opt.interval : 10000,
            samples = (_.isNumber(opt.samples)&& opt.samples > 20) ? opt.samples : 60;
        function updateUsage(usage) {
            var now = (new Date()).getTime();
            usageRef.child(now).set(usage);
            timeouts[now] = setTimeout(function () {
                delete timeouts[now];
                usageRef.child(now).set(null);
            }, samples * interval);
        }

        function repeater() {
            var _usage = getDataFunc(function (usage) {
            });
            if (_usage) {
                updateUsage(_usage);
            } else {
                getDataFunc(function (usage) {
                    updateUsage(usage);
                })
            }
        }

        repeater();
        timer = setInterval(function () {
            repeater();
        }, interval || 10000);
    }

    if (opt) {
        start(opt);
    } else {
        monitorRef.child('_watch').on('value', function (snap) {
            stoper();
            if (snap.val()) start(snap.val());
        })
    }
    return stoper;
};

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