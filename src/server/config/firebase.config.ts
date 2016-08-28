var site = 'sites/detail/:siteName',
  user = site + '/users/detail/:userId',
  paths = {
    'servers': 'servers',
    'queue':'queue',
    'query-request':'query/request',
    'query-response':'query/response',
    'query-specs':'query/specs',
    'query-cache':'query/cache',
    'site': site,
    'product': site + '/products/:type/:productId',
    'article': site + '/articles/:type/:articleId',
    'order-payment': site + '/orders/:type/:orderId/payment',
    'user-order-payment': user + '/orders/:type/:orderId/payment',
    'order-payment-allpay': site + '/orders/detail/:orderId/payment/allpay'
  };


module.exports = {
  projectId: 'project-3415547818359859659',
  serviceAccount: "./quartz-8fdc0aa77390.json",
  databaseURL: "https://quartz.firebaseio.com",
  paths: paths
};
