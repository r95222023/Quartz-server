var firebaseUtil = require('../components/firebaseUtil/firebaseUtil.service'),
  emitter = require('../components/emitter/emitter');

let initIndex = (esc: any, config: any)=> {

  var _config = config || {},
    options = {
      'specId': 'index',
      'numWorkers': _config.numWorkers || 10,
      'sanitize': _config.sanitize || false,
      'suppressStack': _config.suppressStack || true
    },
    rootRef = firebaseUtil.ref('queue');

  var queue = firebaseUtil.queue(rootRef, options, (data: any, progress: any, resolve: any, reject: any) => {

    if (!data.index) reject('index required');

    let req: any = {
      index: data.index
    };
    if (data.type) req.type = data.type;
    if (data.id) req.id = data.id;
    if (data.body) req.body = data.body;

    function indexChanged() {
      emitter.emit('index_changed', {index: data.index, type: data.type});
    }

    switch (data.task) {
      case 'add':
        esc.index(req, (error: any, response: any) => {
          if (error) {
            console.error('failed to index', error);
            reject(error)
          } else {
            console.log('index added', data.id);
            indexChanged();
            resolve();
          }
        });
        break;
      case 'update':
        esc.index(req, (error: any, response: any)=> {
          if (error) {
            console.error('failed to update the index', error);
            reject(error)
          } else {
            console.log('index updated', data.id);
            indexChanged();
            resolve();
          }
        });
        break;
      case 'remove':
        esc.delete(req, (error: any, response: any)=> {
          if (error) {
            console.error('failed to remove the index', error);
            reject(error)
          } else {
            console.log('index removed', data.id);
            indexChanged();
            resolve();
          }
        });
        break;
    }
  });
};

module.exports = initIndex;
