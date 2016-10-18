var _ = require('lodash'),
    firebaseUtil = require('../components/firebaseUtil/firebaseUtil.service');


interface OrderData {
    id: string;
    siteName: string;
    items: $Item[];
    payment: $Payment;
    provider?: $Provider;
    buyer: $Buyer;
    shipment?: $Shipment
}

interface $Payment {
    taxRate: number;
    shipment: number;
    totalAmount: number;
}
interface $Provider {
    id: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    provice?: string;
    country?: string;
    custom?: any;
}
interface $Buyer {
    id: string;
    email?: string;
    phone1?: string;
    phone2?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    provice?: string;
    country?: string;
    custom?: any;
}
interface $Shipment {
    date: number;
    address1: string;
    address2?: string;
    city?: string;
    state?: string;
    provice?: string;
    country?: string;
    track?: any;
    cost?: number
}

interface $Item {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface OrderOptions {
    payment: any;
}
interface PaymentOptions {
    getTotalAmount(items: Items, paymentData: $Payment, shipmentData: $Shipment): number;
    getSubtotal(items: $Item[]): number;
}

class Payment {
    public paymentData: any;
    private _totalAmount: number;
    private _items: Items;
    private _taxRate: number;
    private _shippingCost: number;
    private _getTotalAmount: (items?: $Item[], paymentData?: $Payment, shipmentData?: $Shipment)=>number;

    constructor(items: Items, paymentData: $Payment, shipmentData: $Shipment, paymentOptions: PaymentOptions) {
        this._taxRate = paymentData.taxRate;
        this._shippingCost = shipmentData.cost;
        this._items = items;
        if (paymentOptions) {
            if (paymentOptions.getTotalAmount) {
                this._getTotalAmount = ()=> {
                    return paymentOptions.getTotalAmount(this._items, paymentData, shipmentData)
                }
            } else {
                this._getTotalAmount = ()=>{
                    return Math.floor(this._items.getSubtotal() * (this._taxRate || 1) + (this._shippingCost || 0));
                }
            }
        }
    }

    getTotalAmount() {
        if (!this._totalAmount) {
            this._totalAmount = this._getTotalAmount();
        }
        return this._totalAmount;
    }
}
class Items {
    private _items: $Item[];

    constructor(items: $Item[]) {
        this._items = items;
    }

    getSubtotal() {
        let subtotal: number = 0;
        _.forEach(this._items, (item:any)=> {
            subtotal += item.price * item.quantity;
        });
        return subtotal;
    }
}

export class Order {
    public id: string;
    private _siteName: string;
    items: Items;
    payment: Payment;
    buyer: $Buyer;
    provider: $Provider;
    shipment: $Shipment;
    orderData: OrderData;

    constructor(orderData: OrderData, orderOptions?: OrderOptions) {
        let _orderOptions = orderOptions || {payment: {}};
        this.id = orderData.id;
        this._siteName = orderData.siteName;
        this.items = new Items(orderData.items);
        this.buyer = orderData.buyer;
        this.provider = orderData.provider;
        this.shipment = orderData.shipment;
        this.payment = new Payment(this.items, orderData.payment, this.shipment, _orderOptions.payment);

        this.orderData = _.assign({}, orderData,{payment: this.payment.paymentData});
    }

    getOrderDetail() {
        //
    }

    getOrderList() {
        //
    }

    regOrder() {
        firebaseUtil.ref('order', {siteName: this._siteName}).update(this.orderData);
    }
}
