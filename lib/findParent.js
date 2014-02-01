'use strict';


var Q = require('q');
var levenshtein = require('./levenshtein.js');


module.exports = function(child, root, bkTree, callback) {

  (function findNode(parent) {
    var dis = levenshtein(child.word, parent.word);
    if (dis == 0) {
      callback();
    } else {
      for (var i in parent.links) {
        // i is `string`, compare with `==`
        if (i == dis) {
          bkTree.findOne({_id: parent.links[i]}, function(err, doc) {
            if (err) throw err;
            findNode(doc);
          });
          return;
        }
      }
      callback(parent, dis);
    }
  })(root);

};
