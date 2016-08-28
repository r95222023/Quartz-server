var _ = require('lodash'),
    defaultConfig = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil'),
    util = require('../lib/util'),
    q = require('q');

function isValid(){
    var order = this.order;
    this.valid = !(!order.id || !order.siteName || !order.payment || !order.totalAmount);
    if (this.taxRate !== this.cart.taxRate || this.shipping !== this.cart.shipping) {
        this.valid = false;
    }
    return this.valid;
}

function getSubTotal() {
    var total = 0,
        self = this;
    _.forEach(self.cart.items || {}, function (item) {
        if (Number.isInteger(item.quantity) && _.isNumber(item.price)) {
            total += item.quantity * item.price;
        } else {
            self.valid = false;
            return false;
        }
    });
    return +parseFloat(total).toFixed(2);
}

function getTax() {
    return +parseFloat(((this.cart.subTotal / 100) * this.taxRate )).toFixed(2);
}

function getTotalAmount() {
    var subtotal = this.cart.subTotal,
        tax = getTax.apply(this),
        shipping = this.shipping,
        totalAmount = subtotal === 0 ? 0 : +parseFloat(subtotal + tax + shipping).toFixed(2);
    if (totalAmount !== this.order.totalAmount) {
        this.valid = false;
    }
    return this.valid ? totalAmount : false;
}

function OrderService(order, config) {
    var _config = config || {};

    // this.valid = !(!order.id || !order.siteName || !order.payment || !order.totalAmount);

    this.taxRate = _config.taxRate || 0;
    this.shipping = _config.shipping || 0;
    this.rootRef = _config.FBURL ? firebaseUtil.ref(_config.FBURL) : firebaseUtil.ref(defaultConfig.FBURL);
    this.orderRef = this.rootRef.child('sites/detail/' + order.siteName + '/orders/');
    this.order = order;
    this.cart = this.order.cart || {};

    this.cart.taxRate = this.cart.taxRate || 0;
    this.cart.shipping = this.cart.shipping || 0;

    // if (this.taxRate !== this.cart.taxRate || this.shipping !== this.cart.shipping) {
    //     this.valid = false;
    // }
    isValid.apply(this);
    this.cart.subTotal = getSubTotal.apply(this);
    this.totalAmount = getTotalAmount.apply(this);
}


OrderService.prototype = {
    getTax: function () {
        var self = this;
        return getTax.apply(self);
    },
    getShipping: function () {
        return this.shipping;
    },
    getTotalAmount: function () {
        return this.totalAmount
    },
    isValid: function () {
        return this.valid;
    },
    register: function () {
        var def = q.defer(),
            self = this,
            order = this.order,
            orderData = {},
            now = (new Date()).getTime();

        if (!self.valid) {
            def.reject('invalid order');
        } else {
            var compressed = util.compress({
                createdTime: now,
                id: order.id,
                cart: order.cart,
                clientInfo: order.clientInfo,
                totalAmount: order.totalAmount
            });
            orderData['temp/' + order.id] = {compressed:compressed};
            // orderData['users/detail/'+data.clientInfo.uid+'/orders/'+data.siteName+'/'+data.id]=listData;

            //add and index order
            self.orderRef.update(orderData).then(function () {
                def.resolve(order);
            });
        }


        return def.promise;
    },
    add: function () {
        var def = q.defer(),
            self = this,
            order = this.order,
            orderData = {},
            payment = self.order.payment || {},
            now = (new Date()).getTime();

        if (!self.valid) {
            def.reject('invalid order');
        } else {
            orderData['detail/' + order.id] = {
                createdTime: now,
                id: order.id,
                payment: payment,
                cart: order.cart,
                clientInfo: order.clientInfo,
                totalAmount: order.totalAmount
            };

            orderData['list/' + order.id] = {
                createdTime: now,
                id: order.id,
                paymentType: payment.type,
                cart: order.cart,
                clientInfo: order.clientInfo,
                totalAmount: order.totalAmount
            };
            // orderData['users/detail/'+data.clientInfo.uid+'/orders/'+data.siteName+'/'+data.id]=listData;

            //add and index order
            self.orderRef.update(orderData).then(function () {
                def.resolve(order);
            });
        }


        return def.promise;
    },
    remove: function () {
        if (!this.order.id) return;
        self.orderRef.child('list/' + this.order.id).remove();
        self.orderRef.child('detail/' + this.order.id).remove();
    },
    charge: function (data) {
        var def = q.defer();
        switch (data.payment.type) {
            case 'stripe':
                def.resolve();
                break;
            case 'allpay':
                def.resolve();
                break;
        }
        return def.promise;
    }
};
//
// var testOrder = {
//     "id": "obsidian1470269677793",
//     "siteName": "obsidian",
//     "clientInfo": {
//         "uid": "facebook:10205619029701181",
//         "lastName": "Huang",
//         "firstName": "Bo-Yan",
//         "email": "u910328@gmail.com",
//         "phone": 13126783889
//     },
//     "cart": {
//         "shipping": null,
//         "tax": 0,
//         "taxRate": null,
//         "subTotal": 700,
//         "totalCost": 700,
//         "items": [{
//             "id": "bd_001",
//             "name": "★免運★7/30產季結束 枋山愛文芒果-友善種植A級禮盒(3kg/8-9粒)",
//             "price": 700,
//             "quantity": 1,
//             "data": {},
//             "total": 700
//         }]
//     },
//     "totalAmount": 700,
//     "payment": {
//         "allpay": {
//             "MerchantID": "2000132",
//             "PaymentType": "aio",
//             "ReturnURL": "http://http://24.14.103.233/allpayReceive?sitename=obsidian&uid=facebook:10205619029701181",
//             "PaymentInfoURL": "http://24.14.103.233/allpayPaymentInfo?sitename=obsidian&uid=facebook:10205619029701181",
//             "ChoosePayment": "ALL",
//             "NeedExtraPaidInfo": "Y",
//             "TradeDesc": "required, please set a value.",
//             "MerchantTradeDate": "2016/08/03 19:14:37",
//             "TotalAmount": 700,
//             "MerchantTradeNo": "obsidian1470269677793",
//             "ItemName": "★免運★7/30產季結束 枋山愛文芒果-友善種植A級禮盒(3kg/8-9粒) $700*1",
//             "DeviceSource": "P",
//             "CheckMacValue": "DDCCDF740A7C8623AAE503246D94497E"
//         }, "type": "allpay"
//     },
//     "shipment": {"address1": "1039 s oakley blvd", "city": "Chicago", "postalCode": "60612"},
//     "acceptTOS": true,
//     "_id": "-KOHtnGQg2jnAYi7pfWn"
// };
// var os = new OrderService(testOrder);
// os.register();
module.exports = function (order, config) {
    return new OrderService(order, config)
};
