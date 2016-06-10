var os = require('os'),
    firebaseUtil = require('./firebaseUtil'),
    generalConfig = require('../config');

//TODO: use socket.io to send the data;

function SystemMonitor(conf) {
    var serverInfo = conf.SERVER_INFO ? conf.SERVER_INFO : {};
    this.serversRef = firebaseUtil.ref(serverInfo.serverMonitorRefUrl || (generalConfig.FBURL + config.SERVER_PATH));
    this.thisServerRef = this.serversRef.child(os.hostname().replace(/\./g,"_"));
    this.consoleRef = this.thisServerRef.child('console');
}

SystemMonitor.prototype.overrideConsole = function (console, maxlines) {
    var lines = 0,
        _maxlines = maxlines || 100,
        self = this;
    self.consoleRef.set(null);
    self.consoleRef.onDisconnect().set(null);

    ["log", "warn", "error"].forEach(function (method) {
        var oldMethod = console[method].bind(console);
        console[method] = function () {
            lines++;
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args.push(arguments[i])
            }

            oldMethod.apply(
                console, args
            );

            self.consoleRef.child(lines).set([method, firebaseUtil.ServerValue.TIMESTAMP].concat(args));

            if (lines > _maxlines) {
                self.consoleRef.child(lines - _maxlines).set(null)
            }
        };
    });

    function clearFbConsole() {
        self.consoleRef.set(null);
    }

    return clearFbConsole;
};


//// 取得usage 後會執行cb(usage) 將usage利用callback方法傳出
SystemMonitor.prototype.getCpuUsage = function (cb) {
    //for UNIX-like system
    if (os.loadavg()[0]) {
        cb(Math.floor(os.loadavg()[0] * 100),-2);
        return
    }
    //Grab first CPU Measure
    var startMeasure = cpuAverage();

//Set delay for second Measure
    setTimeout(function () {
        //Grab second Measure
        var endMeasure = cpuAverage();

        //Calculate the difference in idle and total time between the measures
        var idleDifference = endMeasure.idle - startMeasure.idle;
        var totalDifference = endMeasure.total - startMeasure.total;

        //Calculate the average percentage CPU usage
        var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);

        //Output result to console
        if (typeof cb === 'function') {
            cb(percentageCPU)
        } else {
            console.log(percentageCPU + "% CPU Usage.");
        }
    }, 100);
};

SystemMonitor.prototype.getMemoryUsage = function () {
    return Math.floor(100*(1-os.freemem()/os.totalmem()));
};


SystemMonitor.prototype.getSysInfo = function () {
    return {
        arch: os.arch(),
        cpus: os.cpus(),
        networkInterfaces: firebaseUtil.formalizeData(os.networkInterfaces()),
        freemem: os.freemem() + ' bytes',
        totalmem: os.totalmem() + ' bytes',
        platform: os.platform(),
        hostname: os.hostname().replace(/\./g,"_")
    }
};


//Create function to get CPU information
//Credit to https://gist.github.com/bag-man/5570809
function cpuAverage() {

    //Initialise sum of idle and time of cores and fetch CPU info
    var totalIdle = 0, totalTick = 0;
    var cpus = os.cpus();

    //Loop through CPU cores
    for (var i = 0, len = cpus.length; i < len; i++) {
        //Select CPU core
        var cpu = cpus[i];

        //Total up the time in the cores tick
        for (var type in cpu.times) {
            totalTick += cpu.times[type];
        }

        //Total up the idle time of the core
        totalIdle += cpu.times.idle;
    }


    //Return the average Idle and Tick times
    return {idle: totalIdle / cpus.length, total: totalTick / cpus.length};
}


module.exports = function (config) {
    return new SystemMonitor(config);
};
