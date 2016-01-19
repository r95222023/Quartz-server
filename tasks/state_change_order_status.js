var firebaseUtil = require('../lib/firebaseUtil');


module.exports = function (fbUrl, tasksRefPath, options) {
    var rootRef = firebaseUtil.ref(fbUrl);
    options = options||{};

    var queue = firebaseUtil.queue(rootRef, {
        //specId: 'change_order_status',
        tasksRefPath: tasksRefPath||'queue',
        specsRefPath: options.specsRefPath || 'config/server/queue/orderSpecs'
    }, function (data, progress, resolve, reject) {
        var orderRootRef = data.rootRefUrl? firebaseUtil.ref(data.rootRefUrl):rootRef,
            statusPath = data.statusPath||'orders/$orderId/status',
            updateData={},
            orderId = data.orderId.split(',');

        for (var i = 0; i < orderId.length; i++) {
            updateData[statusPath.replace('$orderId', orderId[i])]= data.status;
        }
        orderRootRef.update(updateData, function (err) {
            if(err) {reject(err)} else {
                resolve({response:'success'});
            }
        })

    })
};


