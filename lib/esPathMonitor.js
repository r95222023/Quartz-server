var fbutil = require('./firebaseUtil');

function PathMonitor(esc, firebaseUrl, path) {
    this.ref = fbutil.ref(firebaseUrl + '/' + path.path);
    console.log(this.ref.toString());
    console.log('Indexing %s/%s using path "%s"'.grey, path.index, path.type, this.ref.toString());
    this.esc = esc;

    this.index = path.index;
    this.type = path.type;
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
            .orderByChild('_index')
            .equalTo(null)
            .on('child_added', this._process.bind(this, this._childAdded));
        this.changeMonitor = this.ref
            .orderByChild('_index')
            .equalTo(this.index)
            .on('child_changed', this._process.bind(this, this._childChanged));
        this.removeMonitor = this.ref
            .orderByChild('_index')
            .equalTo(this.index)
            .on('child_removed', this._process.bind(this, this._childRemoved));
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

    _childAdded: function (snap, data) {
        var key = snap.key(),
            name = nameFor(this, key),
            self = this;
        snap.ref().update({
            _index: this.index
        }, function (fberr) {
            self.esc.index({
                index: self.index,
                type: self.type,
                id: key,
                body: {
                    doc: data
                }
            }, function (error, response) {
                if (error||fberr) {
                    console.error('failed to index %s: %s'.red, name, err||fberr);
                } else {
                    console.log('indexed'.green, name);
                }
            })
        });
    },

    _childChanged: function (snap, data) {
        var key = snap.key(),
            name = nameFor(this, key);
        this.esc.index({
            index: this.index,
            type: this.type,
            id: key,
            body: {
                doc: data
            }
        }, function (error, response) {
            if (error) {
                console.error('failed to index %s: %s'.red, name, err);
            } else {
                console.log('updated'.cyan, name);
            }
        });
    },

    _childRemoved: function (snap, data) {
        var key=snap.key(),
            name = nameFor(this, key);
        this.esc.delete({
            index: this.index,
            type: this.type,
            id: key
        }, function (error, response) {
            if (error) {
                console.error('failed to index %s: %s'.red, name, err);
            } else {
                console.log('deleted'.cyan, name);
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
            console.log('Monitoring dynamic index'.green, name, pathProps);
        }
    },
    _remove: function (snap) {
        var name = snap.key();
        var pathProps = snap.val();
        // kill old monitor
        if (this.paths[name]) {
            this.paths[name]._stop();
            this.paths[name] = null;
            console.log('Stopped monitoring dynamic index'.red, name, pathProps);
        }
    },
    _change: function (snap) {
        var name = snap.key();
        var pathProps = snap.val();
        // kill old monitor
        if (this.paths[name]) {
            this.paths[name]._stop();
            this.paths[name] = null;
            console.log('Stopped monitoring dynamic index'.red, name, pathProps);
        }
        // create new monitor
        if (pathProps !== null && pathProps.index && pathProps.path && pathProps.type) {
            this.paths[name] = this.factory(pathProps);
            console.log('Monitoring dynamic index'.green, name, pathProps);
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