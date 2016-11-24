let express: ()=>any = require('express'),
    bodyParser = require('body-parser');

let app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

export = app;
