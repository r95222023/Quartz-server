//test task
module.exports = {
    refUrl: 'https://lauchbox.firebaseio.com/products',
    tasks: {
        'product': ['snapshot', function (snapshot) {
            var def = q.defer();
            firebaseUtil.ref(config.FBURL + 'products/' + snapshot.val().itemId)
                .once('value', function (snap) {
                    def.resolve(snap.val());
                });
            return def.promise
        }],
        'test': ['snapshot', 'product', function (snapshot, product) {
            console.log('res', snapshot.val());

            console.log('res', product);
        }]
    }
};