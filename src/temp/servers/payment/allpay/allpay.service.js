var allpay = require('allpay'),
    config = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil'),
    _ = require('lodash');

function validateData(data) {
    return data['CheckMacValue'] === allpay.genCheckMacValue(data);
}

function updateMain(siteName, data, status) {
    delete data.CheckMacValue;
    updateOrder(siteName, data, status);
}

function updateUser(siteName, userId, data, status) {
    var params = {
        siteName: siteName,
        userId: userId,
        orderId: data.MerchantID
    };
    firebaseUtil.batchUpload({
        'user-order-paymentt#detail': {
            params: _.assign({type: 'detail'}, params),
            data: {allpay: data, status: status}
        },
        'user-order-payment#list': {params: _.assign({type: 'detail'}, params), data: {allpay: data, status: status}}
    });
}

function updateOrder(siteName, data, status) {
    firebaseUtil.batchUpload({
        'order-payment#detail': {
            params: {type: 'detail', siteName: siteName, orderId: data.MerchantTradeNo},
            data: {allpay: data, status: status}
        },
        'order-payment#list': {
            params: {type: 'list', siteName: siteName, orderId: data.MerchantTradeNo},
            data: {allpay: data, status: status}
        }
    });
}

module.exports = {
    validateData: validateData,
    // updateOrder:updateOrder,
    updateMain: updateMain,
    updateUser: updateUser
};