var _ = require('lodash'),
    firebaseUtil = require('../lib/firebaseUtil'),
    q = require('q');

function OrderService(order, config) {
    var _config = config || {};
    this.valid = true;
    this.taxRate = _config.taxRate || 0;
    this.shipping = _config.shipping || 0;
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
        var def = q.defer();
        //add and index order
        // invalid => def.reject(".....")
        def.resolve();
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


/**
 * Created by BOSS on 2016/4/7.
 */
