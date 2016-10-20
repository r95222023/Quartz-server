var express = require('express'),
    bodyParser = require('body-parser'),
    handlePaymentInfo = require('./allpayPaymentInfo'),
    handleReceive = require('./allpayReceive');

var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

handlePaymentInfo(app);
handleReceive(app);

module.exports = app;