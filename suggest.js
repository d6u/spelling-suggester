'use strict';


var fs = require('fs');
var Q = require('q'); // Use Q to avoid maximum callstack error

var getCollection = require('./lib/getCollection.js');
var levenshtein = require('./lib/levenshtein.js');
var Readline = require('./lib/Readline.js');
var findParent = require('./lib/findParent.js');


var maxDis = 2; // max edit distance parameter
var maxSuggestionReturned = 10000; // max returned word number
var file = new Readline('./misspelled_queries.csv'); // mis-spelled query
var ws = fs.createWriteStream('suggestions.txt'); // target file to save


getCollection(function(bkTree) {
  // file root word
  bkTree.findOne({root: true}, function(err, root) {
    if (err) throw err;

    // hold value to calculate average look up time
    var everageTime = 0;

    (function next() {
      var startTime = (new Date()).getTime();

      file.nextLine(function(line) {
        if (line && line.length) {

          var result = [];

          // record how many records are compared with current word
          var wordSearched = 0;

          // function to call when look up for current word is finished
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

          // compare root with current word
          var compareWord = function(root, done) {
            wordSearched++;
            var dis = levenshtein(line, root.word);
            if (dis <= maxDis)
              result.push(root);

            var keys = Object.keys(root.links);
            var index = 0;

            // async serial recursive
            var nextKey = function() {
              // Use Q to avoid maximum callstack error
              var deferred = Q.defer();
              deferred.promise.then(nextKey);

              // control how many suggestions are returned
              if (result.length >= maxSuggestionReturned) {
                finishLine();
                return;
              }
              var i = Number(keys[index++]);
              if (!isNaN(i)) {

                // searching BK-Tree
                if (Math.abs(dis - maxDis) <= i && i <= dis + maxDis) {
                  bkTree.findOne({_id: root.links[i]}, function(err, doc) {
                    if (err) throw err;
                    compareWord(doc, function() {
                      deferred.resolve();
                    });
                  });
                }
                else deferred.resolve();

              }
              else done();
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
