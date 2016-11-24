let site = 'sites/detail/:siteName',
    user = site + '/users/detail/:userId',
    analysisMonth = 'analysis/months/:month',
    analysisWeek = 'analysis/weeks/:week',
    analysisDate = 'analysis/dates/:date',
    paths:any = {
        'order-analysis': site + '/orders/analysis/:path',
        'order-analysis-month': site + '/orders/' + analysisMonth,
        'order-analysis-week': site + '/orders/' + analysisWeek,
        'order-analysis-date': site + '/orders/' + analysisDate,
        'servers': 'servers',
        'queue': 'queue',
        'queue-tasks': 'queue/tasks',
        'queue-task': 'queue/tasks/:id',
        'query-request': 'query/request',
        'query-response': 'query/response',
        'query-specs': 'query/specs',
        'query-cache': 'query/cache',
        'templates': 'templates/:type',
        'template': 'templates/:type/:id',
        'my-sites': 'users/detail/:uid/sites',
        'user-path': 'users/detail/:userId/:path',
        'sites': 'sites/:type',
        'site': 'sites/:type/:siteName',
        'site-path': site + '/:path',
        'site-config-preload': site + '/config/preload',
        'site-config-plan': site + '/config/plan',
        'site-config-payment': site + '/config/payments/:provider',
        'site-temps': site + '/temp/:type',
        'files': site + '/files',
        'file-path': site + '/files/:path',
        'file-root-path': site + '/files:path',
        'users':'users/:type',
        'users-site': site + '/users/:type/:userId',
        'site-users': site + '/users/:type',
        'site-user': site + '/users/:type/:userId',
        'pages': site + '/pages/:type',
        'page': site + '/pages/:type/:id',
        'page-property': site + '/pages/:type/:id/:property',
        'widgets': site + '/widgets/:type',
        'widget': site + '/widgets/:type/:id',
        'products': site + '/products/:type',
        'product-categories': site + '/products/config/categories',
        'product': site + '/products/:type/:id',
        'articles': site + '/articles/:type',
        'article-categories': site + '/articles/config/categories',
        'article': site + '/articles/:type/:id',
        'orders': site + '/orders/:type',
        'site-orders': site + '/orders/:type',
        'user-order': user + '/orders/:type/:id',
        'notifications': 'users/detail/:uid/notifications',
        'plans': 'plans/:type'
    };

let serviceAccount = {
  "type": "service_account",
  "project_id": "project-3415547818359859659",
  "private_key_id": "8fdc0aa77390cb6820f61685b4cfb2d07325fa2f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCILtOReKQ4lUh1\nBQ09X2oTQUOUcFoPwQ8TUxdlyX17ZauGVqQOKUk9lo3yP0slXQ83+0497tKRYT3M\nPdtNJRPb1Bo/ZT5ql4PcT9NbO8aZ3o9a5tyTcPPdWp3aB0FlyqVSKDE8R3VhpmU3\nr+jPkzE0VMNKvXAPNsW385peBcqJbYXOx5xF0l2a7bZDvAiq8wfytO2ajmsimfkV\n8WThZS9btn880KVqA+a9xdvG7TAr7jJPeMcuUGmD9qRx7Tt89QboUg/n3JbEq7HB\n0FTTxeDCD/4kRiYetArfcFfp4s4OyJkcMzUPidLSyG+cFqJhuzOX350lupmzH/pO\naTrAha2dAgMBAAECggEAGPmVfWFFpMbj8eoKQo4kEwHuFeQA8FC0phOf/9/S7nV3\n3nw3PA2gS/Y3dAzdiC2n49lnwP3yigzuW22gsWYyXSdp5OR5bOz6lsXg+iNdSczC\nN6aNH1EguCCtQFYCTVu7s/SBCxAD2/O7LlpJdQAGjxVYd3WEfpXJ7vFzBvlC6q7x\nny/wRUDNRdutxha24qEBx8EWe+6ekPZoGz7lI4VFiPexTKG8JneM82azL4Ee8NIj\nvqO7/byaRgYNmHvWdaAE4F63EfTMd4FisBrpm5vR4G59mv6LSQa+yDQWoCNVSCkZ\nhaG/qdScK4mEkTehksKY81000Cbkx5VzLgRDYgogoQKBgQDKD2TBWor/4Igz2bo3\nJ0aZ19NH5v++AlPGSFU6wUYbqu8N6rhA22aKZK+F3wImh/rngcrk8FalnzYYZjrp\n2v+0UjZtcpysun35Qng1TUtqd48XIz1Eg0YDBAp749NAHcJiYYNkJsTB4tkP6XEe\nHgRUhbYmDnZUuL4fPVhjWeTeOQKBgQCsiXGQPRFW0B+G2W+urqMdCzUt5AMBDjEA\n/aP+n3EUSCaKK6ChNs2Cn9ob7I4OLbF24ITpQsxKUsdp5BdjANZ9y4PHwrgZUYOe\nLpWp8LumW+BNceB4T5+0mRLbyNi4ZwQXMLPADIaohf9Ypz89ip36cRdK+MWaJSAs\nOsLP+3AKhQKBgGmBWC7NxD6PUw8f5OffjjHOS/gDWg4w0OV752TifmT8AA7YPJVA\n+m3Q3QWdyFWuMwim8PZRuCyK0Ygz+RcazuGs+9ZyPfTC+/wnBPVwAqz4+LIwKFGZ\n6fixJ3hBIZEc+N695AlrZNmIRabVUcdUDRbFKrL8YjUiscNGGNznl2WhAoGAUyBZ\nJYw2iWP2fIrQAxJCpiCbO4PqapzCwV5yn5+D5KiqYNGKL4Hu26tWczOycWRUZxjf\nEF9Ne9WMHBl3pwxlSvA9ioXnGtOqHREGrHy+e/UyCT3/TxfVszY43slSmO2RC/c7\n8yBV1GXS04yorGbXnCzWcxmOYqjWaljZOUlD/t0CgYAvpmocipmJi92FwON4NqKv\nXjodUHBJPzFouU4589KlrB513oKr8sRzKSPiLMGrdzvJ33ydTyK51Xwp1HKirOen\nCB8k/W/Rv+4ZZTuTezg2BkGolrwx090nfYozWEv+7Kk87AKlfMTkC45LeH45CZde\n07e3FMfAu4JQ+Waq+HARNw==\n-----END PRIVATE KEY-----\n",
  "client_email": "main-316@project-3415547818359859659.iam.gserviceaccount.com",
  "client_id": "113072460488959900424",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/main-316%40project-3415547818359859659.iam.gserviceaccount.com"
};

export= {
  serviceAccount:serviceAccount,
  databaseURL:'https://quartz.firebaseio.com',
  paths:paths
}