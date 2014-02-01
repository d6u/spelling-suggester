'use strict';


var expect = require('chai').expect;
var getCollection = require('../lib/getCollection.js');


describe('getCollection', function() {
  it('should return bkTree collection', function(done) {
    getCollection(function(bkTree) {
      expect(bkTree.collectionName).to.equal('bk_tree');
      done();
    });
  });
});
