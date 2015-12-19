var app = require('../lib/expressApp');

app.post('/allpayAIO', function (req, res) {
    console.log(req.body);
    res.status(200).send('1|OK');
});