var firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util'),
    _ = require('lodash'),
    q = require('q'),
    config = require('../config'),
    to2dig = util.to2dig;

function getKey(d) {
    var _date = d ? (_.isNumber(d) ? new Date(d) : d) : new Date(),
        year = to2dig(_date.getUTCFullYear() - 2000),
        month = to2dig(_date.getUTCMonth() + 1),
        date = to2dig(_date.getUTCDate()),
        key = year + '' + month + '' + date;

    return parseInt(key).toString(36);
}
//
// function getMondayKey(d) {
//     var day = d.getUTCDay(),
//         diff = d.getUTCDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
//     return getKey(new Date(d.setUTCDate(diff)));
// }

function getKeyOf(period, d) {
    var _date = d ? (_.isNumber(d) ? new Date(d) : d) : new Date();
    switch (period) {
        case 'day':
            return getKey(_date);
            break;
        case 'week':
            var day = _date.getUTCDay(),
                diff = _date.getUTCDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
            return getKey(new Date(d.setUTCDate(diff)));
            break;
        case 'month':
            return getKey(new Date(_date.getUTCFullYear(), _date.getUTCMonth(), 1));
            break;
    }
}

function getData(rootRefUrl, startAt, endAt, opt) {
    var def = q.defer(),
        ref = firebaseUtil.ref(rootRefUrl).orderByKey();

    function resolve(snap) {
        def.resolve(snap.val());
    }

    ref = ref.startAt(getKey(startAt));
    if (endAt) ref = ref.endAt(getKey(endAt));
    ref.once('value', resolve);
    return def.promise;
}


function getRefUrl(siteName, period) {
    var d = new Date(),
        rootRefUrl = config.FBURL + '/sites/detail/' + siteName + '/analysis';
    switch (period) {
        case 'day':
            return rootRefUrl + '/day/' + getKey(d);
            break;
        case 'week':
            return rootRefUrl + '/week/' + getKeyOf('week', d);
            break;
        case 'month':
            return rootRefUrl + '/month/' + getKeyOf('month', d);
            break;
    }
}


function updateProductAnalytics(ref, siteName, period, id, quantity, price, orderData) {
    ref.child('products').child(id).transaction(function (data) {
        var _data = data || {},
            quantitySum = (_data.q || 0) + quantity,
            totalSum = (_data.t || 0) + quantitySum * price;

        if (period === 'week') {
            //在list 裡的product有analysis property 以便排序
            var keyQuantity=getKeyOf(period) + ':' + quantitySum,
                pAnalysis={
                    q: keyQuantity
                };
            if(orderData.category) pAnalysis.q1=orderData.category+keyQuantity;
            if(orderData.category&&orderData.subcategory) pAnalysis.q2=orderData.category+orderData.subcategory+keyQuantity;
            firebaseUtil.ref(config.FBURL + '/sites/detail/' + siteName + '/products/list/' + id + '/analysis/week')
                .update(pAnalysis);
        }

        return {
            q: quantitySum,
            t: totalSum
        };
    })
}

function updateAnalysis(siteName, period, orderData) {
    //需要 cart 和totalAmount 這兩個properties
    var ref = firebaseUtil.ref(getRefUrl(siteName, period)),
        items = orderData.cart.items || {};
    ref.child('orders').transaction(function (data) {
        var _data = data || {},
            total = (_data.total || 0) + orderData.totalAmount;
        return (total || 0) + orderData.totalAmount;
    });
    _.forEach(items, function (item) {
        updateProductAnalytics(ref, siteName, period, item.id, item.quantity, item.price, orderData);
    });
}


function update(siteName, orderId) {
    var ref = firebaseUtil.ref(config.FBURL+'/sites/list/'+siteName+'/orders/detail/'+orderId);
    ref.once('value', function(snap){
        _.forEach(['day', 'week', 'month'], function (period) {
            updateAnalysis(siteName, period, snap.val())
        })
    });
}


module.exports = {
    update:update
};