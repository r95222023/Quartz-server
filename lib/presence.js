var firebaseUtil=require('./firebaseUtil'),
    config=require('./config');


// since I can connect from multiple devices or browser tabs, we store each connection instance separately
// any time that connectionsRef's value is null (i.e. has no children) I am offline
var myConnectionsRef = firebaseUtil.ref(config.SERVER_CONNECTION_URL);

// stores the timestamp of my last disconnect (the last time I was seen online)
var lastOnlineRef = new Firebase('https://<YOUR-FIREBASE-APP>.firebaseio.com/users/joe/lastOnline');

var connectedRef = new Firebase('https://<YOUR-FIREBASE-APP>.firebaseio.com/.info/connected');
connectedRef.on('value', function(snap) {
    if (snap.val() === true) {
        // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)

        // add this device to my connections list
        // this value could contain info about the device or a timestamp too
        var con = myConnectionsRef.push(true);

        // when I disconnect, remove this device
        con.onDisconnect().remove();

        // when I disconnect, update the last time I was seen online
        lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    }
});