'use strict';


var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var Q = require('q'); // Use Q to avoid maximum callstack error

var getCollection = require('./lib/getCollection.js');
var levenshtein = require('./lib/levenshtein.js');
var Readline = require('./lib/Readline.js');
var findParent = require('./lib/findParent.js');


var maxDis = 2;
var maxSuggestionReturned = 10000;
var file = new Readline('./misspelled_queries.csv');
var ws = fs.createWriteStream('suggestions.txt');


getCollection(function(bkTree) {
  bkTree.findOne({root: true}, function(err, root) {
    if (err) throw err;
    bkTree.find({root: {$ne: true}}).toArray(function(err, docs) {
      var everageTime = 0;

      (function next() {
        var startTime = (new Date()).getTime();
        file.nextLine(function(line) {
          if (line && line.length) {

            var result = [];
            var counter = 1;
            var wordSearched = 0;

            var finishLine = function() {
              result.sort(function(a, b) {
                return b.freq - a.freq;
              });
              result = result.map(function(r) {
                return r.word;
              });
              var endTime = (new Date()).getTime();
              var timeUsed = endTime - startTime;
              everageTime = (everageTime * (file.cursor - 1) + timeUsed) / file.cursor;
              console.log('#%d, word searched %d, everage time %dms',
                          file.cursor,
                          wordSearched,
                          everageTime);
              ws.write('* ' + line + ': ["' + result.join('", "') + "\"]\n");
              next();
            }

            var compareWord = function(root, done) {
              wordSearched++;
              counter--;
              var dis = levenshtein(line, root.word);
              if (dis <= maxDis) {
                result.push(root);
              }

              var keys = Object.keys(root.links);
              var index = 0;

              var nextKey = function() {
                var deferred = Q.defer();
                if (result.length >= maxSuggestionReturned) {
                  finishLine();
                  return;
                }
                var i = Number(keys[index++]);
                if (!isNaN(i)) {
                  if (Math.abs(dis - maxDis) <= i && i <= dis + maxDis) {
                    counter++;
                    bkTree.findOne({_id: root.links[i]}, function(err, doc) {
                      if (err) throw err;
                      compareWord(doc, function() {
                        deferred.resolve();
                      });
                    });
                  } else {
                    deferred.resolve();
                  }
                } else {
                  done();
                }
                deferred.promise.then(nextKey);
              };

              nextKey();
            }

            compareWord(root, finishLine);

          } else {
            console.log('Processed all queries');
            console.log('Everage time %dms', everageTime);
            ws.end();
            process.exit(0);
          }
        });
      })();
    });
  });
});
