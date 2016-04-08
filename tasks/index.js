var defaultConfig = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil');

function init(esc, config){

    var _config=config||{},
        options = {
            'specId': 'index',
            'numWorkers': _config.numWorkers||1,
            'sanitize': _config.sanitize||false,
            'suppressStack': _config.suppressStack||true
        },
        rootRef = firebaseUtil.ref(_config.FBURL||defaultConfig.FBURL).child("queue");
    
    var queue = firebaseUtil.queue(rootRef, options, function (data, progress, resolve, reject) {

        if(!data.index) reject('index required');

        var req = {
            index:data.index
        };
        if(data.type) req.type=data.type;
        if(data.id) req.id=data.id;
        if(data.body) req.body=data.body;

        switch(data.task){
            case 'add':
                esc.index(req, function (error, response) {
                    if (error) {
                        console.error('failed to index', error);
                        reject(error)
                    } else {
                        console.log('indexed', data.id);
                        resolve();
                    }
                });
                break;
            case 'update':
                esc.index(req, function (error, response) {
                    if (error) {
                        console.error('failed to update the index', error);
                        reject(error)
                    } else {
                        console.log('index updated', data.id);
                        resolve();
                    }
                });
                break;
            case 'remove':
                esc.delete(req, function (error, response) {
                    if (error) {
                        console.error('failed to remove the index', error);
                        reject(error)
                    } else {
                        console.log('index removed', data.id);
                        resolve();
                    }
                });
                break;
        }
    });
}

module.exports = init;




