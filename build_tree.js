'use strict';


var getCollection = require('./lib/getCollection.js');
var levenshtein = require('./lib/levenshtein.js');
var Readline = require('./lib/Readline.js');
var findParent = require('./lib/findParent.js')
var Q = require('q'); // Use Q to avoid maximum callstack error


var file = new Readline('./word_frequency.csv');


// Empty `bk_tree` collection
var emptyCollection = Q.defer();
getCollection(function(bkTree) {
  bkTree.remove(null, {w: 1}, function() {
    emptyCollection.resolve();
  });
});


// Save root (first, most frequent) word
var savedRootWord = Q.defer();
emptyCollection.promise.then(function() {
  file.nextLine(function(line) {
    if (line && line.length) {
      getCollection(function(bkTree) {
        var data = line.split(',');
        bkTree.insert(
          {word: data[0], freq: parseInt(data[1]), root: true, links: {}},
          {w: 1},
          function(err, doc) {
            savedRootWord.resolve();
          }
        );
      });
    }
  });
});


// Save words and build BK-Tree (from hight frequency to low)
savedRootWord.promise.then(function() {
  (function walker() {

    // use Q to avoid maximum callstack error
    var deferred = Q.defer();
    deferred.promise.then(walker);

    // Save and build tree line by line
    file.nextLine(function(line) {
      if (line && line.length) {

        // output progress information
        console.log('Processing words => %d%',
                    Math.round(file.cursor / file.lines.length * 100));

        getCollection(function(bkTree) {
          var data = line.split(',');
          bkTree.insert(
            {word: data[0], freq: parseInt(data[1]), links: {}},
            {w: 1},
            function(err, docs) {
              if (err) throw err;
              var doc = docs[0];
              bkTree.findOne({root: true}, function(err, root) {
                if (err) throw err;
                findParent(doc, root, bkTree, function(parent, dis) {

                  // insert pointer to parent record of current word
                  var _set = {};
                  _set['links.'+dis] = doc._id;
                  bkTree.findAndModify(
                    {_id: parent._id},
                    null,
                    {$set: _set},
                    {w: 1},
                    function(err) {
                      if (err) throw err;
                      deferred.resolve();
                    }
                  );

                });
              });
            }
          );
        });
      } else {
        console.log('Finished building indexes');
        process.exit(0);
      }
    });

  })();
});
