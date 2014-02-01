'use strict';


var expect = require('chai').expect;
var levenshtein = require('../lib/levenshtein.js');


describe('levenshtein', function() {
  it('should return the edit distance between two words', function() {
    expect(levenshtein('taxi', 'tax')).to.equal(1);
    expect(levenshtein('tax', 'taxi')).to.equal(1);
    expect(levenshtein('axe', 'arc')).to.equal(2);
    expect(levenshtein('arc', 'axe')).to.equal(2);
  });
});
