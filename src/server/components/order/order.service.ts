var _ = require('lodash'),
    errorHandler = require('../components/errorHandler/errorHandler.service'),
    firebaseUtil = require('../components/firebaseUtil/firebaseUtil.service');
class Payment {
    private _totalAmount: number;
    private _items: Items;
    private _taxRate: number;
    private _shippingCost: number;
    private _getTotalAmount: (items?: Items, paymentData?: any, shipmentData?: ShipmentData)=>number;

    constructor(items: Items, paymentData: PaymentData, shipmentData: ShipmentData, paymentOptions: any) {
        this._taxRate = paymentData.taxRate;
        this._shippingCost = shipmentData.cost;
        this._items = items;
        if (paymentOptions) {
            if (paymentOptions.getTotalAmount) {
                this._getTotalAmount = ()=> {
                    return paymentOptions.getTotalAmount(this._items, paymentData, shipmentData)
                }
            } else {
                this._getTotalAmount = ()=> {
                    return Math.floor(this._items.getSubtotal() * ((this._taxRate || 0) + 1) + (this._shippingCost || 0));
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
    private _items: any;

    constructor(items: any) {
        this._items = items;
    }

    getSubtotal() {
        let subtotal: number = 0;
        _.forEach(this._items, (item: any)=> {
            subtotal += item.price * item.quantity;
        });
        return subtotal;
    }
}

interface BuyerData {
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
interface VendorData {
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


interface PaymentData {
    taxRate: number;
}

interface ShipmentData {
    address1: string;
    address2?: string;
    city?: string;
    state?: string;
    provice?: string;
    country?: string;
    track?: any;
    cost?: number
}


export class Order {
    public id: string;
    private _siteName: string;
    items: Items;
    payment: Payment;
    buyer: BuyerData;
    vendor: VendorData;
    shipment: ShipmentData;
    orderData: any;
    esc: any;

    constructor(orderData: any, esc: any, orderOptions?: any) {
        let _orderOptions = orderOptions || {};
        this.id = orderData.id;
        this._siteName = orderData.siteName;
        this.items = new Items(orderData.items);
        this.buyer = orderData.buyer;
        this.vendor = orderData.vendor;
        this.shipment = orderData.shipment;
        this.payment = new Payment(this.items, orderData.payment, this.shipment, _orderOptions.payment);
        this.esc = esc;
        this.orderData = _.assign({}, orderData, {totalAmount: this.payment.getTotalAmount()});
    }

    indexOrder() {
        let req = {
            index: this._siteName,
            type: 'order',
            id: this.id,
            body: this.orderData
        };
        this.esc.index(req, (error: any, response: any) => {
            if (error) {
                console.error('failed to index', error);
                errorHandler(error, {code: 'ELASTICSEARCH_INDEX_ADD_ERROR'});
                // reject(error)
            } else {
                console.log('index added', this.id);
            }
        });
    }

    countOrder() {
        let order: any = this.orderData;
        let nowDate: any = new Date();
        let now: string = getDate(nowDate);
        let yearAgo: string = getDate(new Date(nowDate.getTime() - 366 * 86400000)); //366 days

        let orderAnalyticsRef: any = firebaseUtil.ref('site-orders?siteName=' + this._siteName + '&type=analytics');

        //update order summary
        orderAnalyticsRef.child('summary').transaction((current:any)=> {
            let res: any = current || {cs: 0, g: 0};
            res.cs += 1;
            res.g += order.totalAmount;
            return res;
        }).then((committed:boolean, summarySnap:any)=> {
            //update order per day
            orderAnalyticsRef.child('days/' + now)
                .transaction((current:any)=> {
                    let res: any = current || {s: 0, i: 0, cs: 0, g: 0}; //s:sales, i:incomes, cs = cumulative sales, g = gross (cumulative income)
                    let summary: any = summarySnap.val();
                    res.s += 1;
                    res.cs = summary.cs;
                    res.g = summary.g;
                    res.i += order.totalAmount;
                    return res;
                });
        });

        //remove obsolete data
        orderAnalyticsRef.child('days').orderByKey().endAt(yearAgo).once('child_added', (snap:any)=> {
            snap.ref.set(null);
        });
    }

    countProduct() {
        let nowDate: any = new Date();
        let now: string = getDate(nowDate);
        let yearAgo: string = getDate(new Date(nowDate.getTime() - 31622400000)); //366 days
        let productAnalyticsRef: any = firebaseUtil.ref('products?siteName=' + this._siteName + '&type=analytics');

        _.forEach(this.orderData.items, (val:any, productId:any)=> {
            //get previous record
            let previousRecPromises: any[] = [];
            [7, 60, 180].forEach((days:number, index:number)=> {
                let previousDate: any = getDate(new Date(nowDate.getTime() - days * 86400000));
                previousRecPromises[index] = productAnalyticsRef.child('data/' + productId + '/days').orderByKey().startAt(previousDate).limitToFirst(1).once('child_added')
            });
            //update product summary
            Promise.all(previousRecPromises).then((previousRecord: any)=> {
                productAnalyticsRef.child('summary/' + productId).transaction((current:any)=> {
                    let res: any = current || {cs: 0, g: 0};
                    res.cs += val.quantity;
                    res.g += val.quantity * val.price;
                    [7, 60, 180].forEach((d:number, index:number)=> {
                        res[d + 'd'] = previousRecord[index] ? res.cs - previousRecord[index].val().cs : res.cs; //current cumulative sales - cumulative sales 7 days ago= cumulative sales in 7 days
                    });
                    return res;
                }).then((commited:boolean, summarySnap:any)=> {
                    //update product per day
                    productAnalyticsRef.child('data/' + productId + '/days').child(now)
                        .transaction((current:any)=> {
                            let summary: any = summarySnap.val();
                            let res = current || {s: 0, i: 0, cs: 0, g: 0};

                            res.cs = summary.cs;
                            res.g = summary.g;

                            res.s += val.quantity;
                            res.i += val.quantity * val.price;
                            return res;
                        });
                });
            });


            //remove obsolete data
            productAnalyticsRef.child('cache/' + productId).child('days').orderByKey().endAt(yearAgo).once('child_added', (snap:any)=> {
                snap.ref.set(null);
            });
        })
    }
}
function to2dig(num:number) {
    return num < 10 ? ('0' + num) : (num + '');
}

function getDate(date:any) {
    let year:string = (date.getFullYear() + '').substr(2, 2),
        month:string = to2dig(date.getUTCMonth() + 1),
        day:string = to2dig(date.getUTCDate());
    return year + month + day
}
