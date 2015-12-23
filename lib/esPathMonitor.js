var fbutil = require('./firebaseUtil'),
    os = require('os'),
    _ = require('lodash');


var cache = {},
    index = {};
//function getIndexBeforChanged(id, newIndex){
//    if(!index[id]) index[id]=newIndex;
//    for(var key in newIndex){
//        if(!index[id][key]) {index[id][key]=newIndex[key]; continue;}
//        if(!newIndex[key]['_version']>index[id][key]['_version']) index[id][key]['_version']=newIndex[key]['_version'];
//    }
//    return index[id];
//}

function getLatestVersion(indexSnap) {
    var largestVersion=0;
    indexSnap.forEach(function (serverSnap) {
        var v = serverSnap.child('_version').val()||0;
        if(v>largestVersion) largestVersion=v;
    });
    return largestVersion
}

function getOutDated(largestVersion, indexValue) {
    var outDatedServer=[];
    _.forEach(indexValue, function (server, key) {
        if(!server['_version']||server['_version']<largestVersion) outDatedServer.push(key);
    })
}

function PathMonitor(esc, firebaseUrl, path) {
    this.ref = fbutil.ref(firebaseUrl + '/' + path.path);
    console.log('Indexing %s/%s using path "%s"', path.index, path.type, this.ref.toString());
    this.esc = esc;

    this.index = path.index;
    this.type = path.type;
    this.hostname = os.hostname();
    this.filter = path.filter || function () {
            return true;
        };
    this.parse = path.parser || function (data) {
            return parseKeys(data, path.fields, path.omit)
        };

    this._init();
}

PathMonitor.prototype = {
    _init: function () {
        this.addMonitor = this.ref
            .orderByChild('_index/' + this.hostname)
            .equalTo(null)
            .on('child_added', this._process.bind(this, this._childAdded));
        this.changeMonitor = this.ref
            .on('child_changed', this._process.bind(this, this._childChanged));
        this.removeMonitor = this.ref
            .on('child_removed', this._process.bind(this, this._childRemoved));
        this.syncMonitor = this.ref
            .orderByChild('_index/' + this.hostname+'/_is_outdated')
            .equalTo(true)
            .on('child_added', this._process.bind(this, this._sync));
    },

    _stop: function () {
        this.ref.off('child_added', this.addMonitor);
        this.ref.off('child_changed', this.changeMonitor);
        this.ref.off('child_removed', this.removeMonitor);
    },

    _process: function (fn, snap) {
        var dat = snap.val();
        if (this.filter(dat)) {
            fn.call(this, snap, this.parse(dat));
        }
    },

    _sync: function (snap, data) {
        this._childChanged(snap, data, true);
    },

    _childAdded: function (snap, data) {
        cache[snap.toString()] = data;

        var key = snap.key(),
            name = nameFor(this, key),
            self = this;
        self.esc.index({
            index: self.index,
            type: self.type,
            id: key,
            body: data
        }, function (error, response) {

            if (error) {
                console.error('failed to index %s: %s'.red, name, error || fberr);
            } else {
                snap.ref().child('_index/' + self.hostname).set(response, function (fberr) {
                    console.log('indexed', name);
                });
            }
        });
    },

    _childChanged: function (snap, data, sync) {
        //getIndexBeforChanged(snap.toString(), snap.child('_index').val());
        if (_.isEqual(cache[snap.toString()], data)) return;
        cache[snap.toString()] = data;
        var self = this;

        var key = snap.key(),
            name = nameFor(self, key),
            versionSnap = snap.child('_index/' + self.hostname + '/_version');
        self.esc.index({
            index: self.index,
            type: self.type,
            id: key,
            body: data
        }, function (error, response) {
            if (error) {
                console.error('failed to index %s: %s', name, error);
            } else {
                //update version number in firebase
                var v = getLatestVersion(snap.child('_index')),
                    currentVersion =versionSnap.val()+ 1,
                    newVersion = (v>currentVersion)? v:currentVersion;
                versionSnap.ref().set(newVersion, function () {
                    console.log('updated', name);

                    //wait and check to see if other server is online
                    if(!sync) {
                        setTimeout(function () {
                            snap.child('_index').ref().once('value', function (latestIndexSnap) {
                                var latestVersion = getLatestVersion(latestIndexSnap);
                                _.forEach(latestIndexSnap.val(), function (serverIndex, serverName) {
                                    var serverVersion = serverIndex['_version']||0;
                                    if(serverVersion<latestVersion){
                                        latestIndexSnap.child(serverName).child('_is_outdated').ref().transaction(function () {
                                            return true
                                        });
                                    }
                                });
                            })
                        },10000);
                    } else {
                        snap.child('_index').child(self.hostname).child('_is_outdated').ref().set(null);
                    }
                });
            }
        });
    },

    _childRemoved: function (snap, data) {
        var key = snap.key(),
            name = nameFor(this, key);
        this.esc.delete({
            index: this.index,
            type: this.type,
            id: key
        }, function (error, response) {
            if (error) {
                console.error('failed to index %s: %s', name, err);
            } else {
                console.log('deleted', name);
            }
        });
    }
};


function nameFor(path, key) {
    return path.index + '/' + path.type + '/' + key;
}

function parseKeys(data, fields, omit) {
    if (!data || typeof(data) !== 'object') {
        return data;
    }
    var out = data;
    // restrict to specified fields list
    if (Array.isArray(fields) && fields.length) {
        out = {};
        fields.forEach(function (f) {
            if (data.hasOwnProperty(f)) {
                out[f] = data[f];
            }
        })
    }
    // remove omitted fields
    if (Array.isArray(omit) && omit.length) {
        omit.forEach(function (f) {
            if (out.hasOwnProperty(f)) {
                delete out[f];
            }
        })
    }
    // remove indicator fields
    var indicator = ['_index', '_owner', '_progress', '_state', '_state_changed', '_error_details'];
    for (var i = 0; i < indicator.length; i++) {
        delete out[indicator[i]];
    }

    return out;
}


//////


function DynamicPathMonitor(ref, factory) {
    this.factory = factory;
    this.paths = {}; // store instance of monitor, so we can unset it if the value changes
    ref.on('child_added', this._add.bind(this));
    ref.on('child_changed', this._change.bind(this));
    ref.on('child_removed', this._remove.bind(this));
}

DynamicPathMonitor.prototype = {
    _add: function (snap) {
        var name = snap.key();
        var pathProps = snap.val();
        if (isValidPath(pathProps)) {
            this.paths[name] = this.factory(pathProps);
            console.log('Monitoring dynamic index', name, pathProps);
        }
    },
    _remove: function (snap) {
        var name = snap.key();
        var pathProps = snap.val();
        // kill old monitor
        if (this.paths[name]) {
            this.paths[name]._stop();
            this.paths[name] = null;
            console.log('Stopped monitoring dynamic index', name, pathProps);
        }
    },
    _change: function (snap) {
        var name = snap.key();
        var pathProps = snap.val();
        // kill old monitor
        if (this.paths[name]) {
            this.paths[name]._stop();
            this.paths[name] = null;
            console.log('Stopped monitoring dynamic index', name, pathProps);
        }
        // create new monitor
        if (pathProps !== null && pathProps.index && pathProps.path && pathProps.type) {
            this.paths[name] = this.factory(pathProps);
            console.log('Monitoring dynamic index', name, pathProps);
        }
    }
};

function isValidPath(props) {
    return props && typeof(props) === 'object' && props.index && props.path && props.type;
}


exports.process = function (esc, firebaseUrl, paths, dynamicPathUrl) {
    paths && paths.forEach(function (pathProps) {
        new PathMonitor(esc, firebaseUrl, pathProps);
    });
    if (dynamicPathUrl) {
        new DynamicPathMonitor(fbutil.ref(firebaseUrl + '/' + dynamicPathUrl), function (pathProps) {
            return new PathMonitor(esc, firebaseUrl, pathProps);
        });
    }
};