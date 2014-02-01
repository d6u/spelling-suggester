'use strict';


var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var Q = require('q'); // Use Q to avoid maximum callstack error in `Readline`
var Readline = require('../lib/Readline.js');
var levenshtein = require('../lib/levenshtein.js');
var findParent = require('../lib/findParent.js');


describe('findParent', function() {

  var bkTree;

  before(function(done) {
    MongoClient.connect('mongodb://localhost:27017/spelling_test', function(err, db) {
      db.collection('bk_tree', function(err, collection) {
        bkTree = collection;
        bkTree.remove(null, {w: 1}, function() {
          var file = new Readline('./test/word_frequency_short.csv');
          file.nextLine(function(line) {
            var data = line.split(',');
            bkTree.insert({word: data[0], freq: data[1], root: true, links: {}}, {w: 1}, function(err, doc) {
              (function walker() {
                var deferred = Q.defer();
                file.nextLine(function(line) {
                  if (line && line.length) {
                    var data = line.split(',');
                    bkTree.insert(
                      {word: data[0], freq: data[1], links: {}},
                      {w: 1},
                      function(err, docs) {
                        if (err) throw err;
                        deferred.resolve();
                      }
                    );
                  } else {
                    done();
                  }
                });
                deferred.promise.then(walker);
              })();
            });
          });
        });
      });
    });
  });

  it('have the right record', function(done) {
    bkTree.count(function(err, count) {
      expect(count).to.equal(30);
      done();
    });
  });

  it('have just one root word', function(done) {
    bkTree.find({root: true}).toArray(function(err, words) {
      expect(words.length).to.equal(1);
      done();
    });
  });


  // test findParent
  // ==========
  it("find the `you` is a child of root", function(done) {
    bkTree.findOne({root: true}, function(err, root) {
      bkTree.findOne({word: 'you'}, function(err, word) {
        findParent(word, root, bkTree, function(parent, dis) {
          expect(parent._id).to.equal(root._id);
          expect(levenshtein(parent.word, word.word)).to.equal(dis);

          var _set = {};
          _set['links.'+dis] = word._id;
          bkTree.findAndModify({_id: parent._id}, null, {$set: _set}, {w: 1, 'new': true}, function(err, doc) {
            expect(doc.links[dis].toString()).to.equal(word._id.toString());
            done();
          });

        });
      });
    });
  });


  it("find the `to` is a child of `you`", function(done) {
    bkTree.findOne({root: true}, function(err, root) {
      bkTree.findOne({word: 'to'}, function(err, word) {
        findParent(word, root, bkTree, function(parent, dis) {
          expect(parent.word).to.equal('you');
          expect(levenshtein(parent.word, word.word)).to.equal(dis);
          done();
        });
      });
    });
  });


  it("find the `hello` is a child of root", function(done) {
    bkTree.findOne({root: true}, function(err, root) {
      bkTree.findOne({word: 'hello'}, function(err, word) {
        findParent(word, root, bkTree, function(parent, dis) {
          expect(parent._id).to.equal(root._id);
          done();
        });
      });
    });
  });


  // Clean up
  after(function(done) {
    bkTree.remove(null, {w: 1}, done);
  });

});
