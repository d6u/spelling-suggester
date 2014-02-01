'use strict';


var MongoClient = require('mongodb').MongoClient;
var emitter = new (require('events').EventEmitter);


var mongodbUrl = 'mongodb://localhost:27017/spelling';
var collectionName = 'bk_tree';
var collection;


MongoClient.connect(mongodbUrl, function(err, db) {
  if (err) throw err;
  db.collection(collectionName, function(err, coll) {
    if (err) throw err;
    collection = coll;
    emitter.emit('ready');
  });
});


// async export of mongo collection
module.exports = function(callback) {
  if (collection === undefined) {
    emitter.on('ready', function() {
      callback(collection);
    });
  } else {
    callback(collection);
  }
}
