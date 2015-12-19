//GENERAL
var APP_NAME = 'Quartz';

//FIREBASE
var FBURL = 'https://quartz.firebaseio.com',
    FIREBASE_SECRETE = 'XGasvxEnG2Dr9EmaR07aLmYisFMBqPJQSgyUam2I',
    ORDER_ROOT_PATH = '/orders',
    SERVER_PATH = '/servers';

//SERVER_INFO
var SERVER_ID = 'GCE-instance-2';
var SERVER_INFO ={
    location:'home'
};

//EMAIL
var SENDER_NAME = 'My Company Name',
    SENDER_ADDRESS = 'r95222023@gmail.com',
    MY_ADDRESS = 'r95222023@gmail.com',
    FROM = SENDER_NAME + '<' + SENDER_ADDRESS + '>',
    GMAIL_ACC = 'freecemailtest@gmail.com',
    GMAIL_PASS = 'r95222023@gmail.com';

//ALLPAY
var ALLPAY = {
    MERCHANT_ID: '2000132',
    HASH_KEY: '5294y06JbISpM5x9',
    HASH_IV: 'v77hoKGq4kWxNNIS',
    BASE_URL: 'payment.allpay.com.tw',
    PORT: 443,
    USE_SSL: true,
    DEBUG: false,
    INITIALIZED: false
};


module.exports = {
    //GENERAL
    APP_NAME: APP_NAME,
    //FIREBASE
    FBURL: FBURL,
    FIREBASE_SECRETE: FIREBASE_SECRETE,
    ORDER_ROOT_PATH: ORDER_ROOT_PATH,
    SERVER_PATH: SERVER_PATH,
    //SERVER_INFO
    SERVER_INFO:SERVER_INFO,
    SERVER_ID: SERVER_ID,
    //EMAIL
    //ALLPAY
    ALLPAY: ALLPAY
};