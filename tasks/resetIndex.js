var firebaseUtil = require('../lib/firebaseUtil'),
    q = require('q');


function esDeleteIndex(esc, index, type , refUrl) {
    esc.delete({
        index: index,
        type: type
    }, function (error, response) {
        firebaseUtil.ref(refUrl).once('value', function (snap) {
            snap.forEach(function (childSnap) {
                childSnap.child('_index').remove();
            })
        })
    });
}


module.exports ={
    esDeleteIndex:esDeleteIndex
};