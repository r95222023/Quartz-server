var _ = require('lodash'),
    defaultConfig = require('../config'),
    firebaseUtil = require('../lib/firebaseUtil'),
    q = require('q');

function OrderService(order, config) {
    var _config = config || {};
    this.valid = true;
    this.taxRate = _config.taxRate || 0;
    this.shipping = _config.shipping || 0;
    this.rootRef = _config.FBURL? firebaseUtil.ref(_config.FBURL):firebaseUtil.ref(defaultConfig.FBURL);
    this.order = order||{};
    this.cart = this.order.cart || {};
}


OrderService.prototype = {
    getSubTotal: function () {
        var total = 0,
            self = this;
        _.forEach(self.cart, function (item) {
            if (Number.isInteger(item.quantity) && _.isNumber(item.price)) {
                total += item.quantity * item.price;
            } else {
                self.valid = false;
                return false;
            }
        });
        return +parseFloat(total).toFixed(2);
    },
    getTax: function () {
        return +parseFloat(((this.getSubTotal() / 100) * this.taxRate )).toFixed(2);
    },
    getShipping: function () {
        return this.shipping;
    },
    totalAmount: function () {
        //getSubTotal在getTax和這邊一共算兩次了
        var subtotal = this.getSubTotal(),
            tax = this.getTax(),
            shipping = this.getShipping(),
            totalAmount = subtotal === 0 ? 0 : +parseFloat(subtotal + tax + shipping).toFixed(2);
        if (totalAmount !== this.order.totalAmount) {
            this.valid = false;
        }
        return this.valid ? totalAmount : false;
    },
    isValid: function () {
        this.totalAmount();
        return this.valid||true;
    },
    add: function(data){
        var def = q.defer(),
            self = this,
            orderData = {},
            payment = data.payment||{},
            now = (new Date()).getTime();
        
        //TODO: check data
        if(!data.cart||!data.id||!data.siteName||!data.payment||!data.totalAmount){
            def.reject('invalid order data');
            return;
        }


        orderData['sites/detail/'+data.siteName+'/orders/detail/'+data.id]={
            createdTime:now,
            id: data.id,
            payment: payment,
            cart: data.cart,
            clientInfo:data.clientInfo,
            totalAmount: data.totalAmount
        };
        
        var listData = {
            createdTime:now,
            id: data.id,
            paymentType: payment.type,
            cart:data.cart,
            clientInfo:data.clientInfo,
            totalAmount: data.totalAmount
        };
        
        orderData['sites/detail/'+data.siteName+'/orders/list/'+data.id]=listData;
        // orderData['users/detail/'+data.clientInfo.uid+'/orders/'+data.siteName+'/'+data.id]=listData;

        //add and index order
        self.rootRef.update(orderData).then(function(){
            def.resolve(data);
        });
        return def.promise;
    },
    charge: function(data){
        var def = q.defer();
        switch(data.payment.type){
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

//var orderValidator = new OrderValidator({
//    cart: {
//        item1: {
//            price: 100,
//            quantity: 2
//        }
//    },
//    totalAmount: 200
//});
//
//console.log(orderValidator.isValid());


module.exports = function (order, config) {
    return new OrderService(order, config)
};
