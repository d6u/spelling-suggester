'use strict';


var expect = require('chai').expect;
var getCollection = require('./lib/getCollection.js');


// Run this test after build_tree.js to
//    test the integrity of bk_tree collection
//
describe('Index integrity test (run after build_tree.js)', function() {
  it('should link all words', function(done) {
    getCollection(function(bkTree) {
      bkTree.count(function(err, count) {
        if (err) throw err;
        var allWords = [];

        bkTree.findOne({root: true}, function(err, root) {
          if (err) throw err;
          (function findChildren(root) {
            allWords.push(root.word);
            console.log(allWords.length);
            if (Object.keys(root.links).length) {
              for (var i in root.links) {
                bkTree.findOne({_id: root.links[i]}, function(err, doc) {
                  if (err) throw err;
                  findChildren(doc);
                });
              }
            } else {
              if (allWords.length === count) finishAssertion();
            }
          })(root);
        });

        // Finish assertion
        function finishAssertion() {
          done();
        }
      });
    });
  });
});
