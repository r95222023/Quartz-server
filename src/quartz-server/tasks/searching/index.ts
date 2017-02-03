import firebaseUtil = require('../../components/firebaseUtil/firebaseUtil.service');
import errorHandler = require('../../components/errorHandler/errorHandler.service');

let resetCache = (cacheName: string) => {
  //TODO: debounce reset?
  firebaseUtil.ref('query-cache').child(cacheName).remove();
};

let mappings: any = {
  article: {
    properties: {
      id: {
        type: 'keyword'
      },
      title: {
        type: 'keyword'
      },
      category: {
        type: 'integer'
      },
      subcategory: {
        type: 'integer'
      }
    }
  },
  product: {
    properties: {
      id: {
        type: 'keyword'
      },
      category: {
        type: 'integer'
      },
      subcategory: {
        type: 'integer'
      }
    }
  },
  order: {
    properties: {
      id: {
        type: 'keyword'
      }
    }
  },
  'order-temp': {
    properties: {
      id: {
        type: 'keyword'
      }
    }
  }
};

let initIndex = (esc: any, config: any) => {
  let _config = config || {},
    options = {
      'specId': 'index',
      'numWorkers': _config.numWorkers || 10,
      'sanitize': _config.sanitize || false,
      'suppressStack': _config.suppressStack || true
    },
    rootRef = firebaseUtil.ref('queue', {});

  function putMapping(siteName: string) {
    //products or articles
    ['article', 'product', 'order', 'order-temp'].forEach((type) => {
      esc.indices.putMapping({
        index: siteName,
        type: type,
        body: mappings[type]
      })
    });
  }

  function createIndex(siteName: string, resolve: any) {
    esc.indices.create({
      index: siteName,
      body: {
        "settings": {
          "number_of_shards": 1
        },
        "mappings": mappings
      }
    }, resolve);
  }

  function deleteIndex(siteName: string, resolve: any) {
    esc.indices.delete({
      index: siteName
    }, resolve);
  }

  let queue = firebaseUtil.queue(rootRef, options, (data: any, progress: any, resolve: any, reject: any) => {

    if (!data.siteName) reject('index required');

    let req: any = {
      index: data.siteName
    };
    if (data.type) req.type = data.type;
    if (data.id) req.id = data.id;
    if (data.body) req.body = data.body;
    req.refresh = "true"; //Todo: debounce?
    function indexChanged() {
      resetCache(data.siteName + data.type);
    }

    switch (data.task) {
      case 'create':
        createIndex(data.siteName, resolve);
        break;
      case 'delete':
        deleteIndex(data.siteName, resolve);
        break;
      case 'add':
        esc.index(req, (error: any, response: any) => {
          if (error) {
            console.error('failed to index', error);
            errorHandler(error, {code: 'ELASTICSEARCH_INDEX_ADD_ERROR'}, reject);
            // reject(error)
          } else {
            console.log('index added', req.index, data.type, data.id);
            indexChanged();
            resolve();
          }
        });
        break;
      case 'update':
        esc.index(req, (error: any, response: any) => {
          if (error) {
            console.error('failed to update the index', error);
            errorHandler(error, {code: 'ELASTICSEARCH_INDEX_UPDATE_ERROR'}, reject);
            // reject(error)
          } else {
            console.log('index updated', req.index, data.type, data.id);
            indexChanged();
            resolve();
          }
        });
        break;
      case 'remove':
        esc.delete(req, (error: any, response: any) => {
          if (error) {
            console.error('failed to remove the index', error);
            errorHandler(error, {code: 'ELASTICSEARCH_INDEX_REMOVE_ERROR'}, reject);

            reject(error)
          } else {
            console.log('index removed', req.index, data.type, data.id);
            indexChanged();
            resolve();
          }
        });
        break;
    }
  });
};

export = initIndex;
