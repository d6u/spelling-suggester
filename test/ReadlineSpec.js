'use strict';


var expect = require('chai').expect;
var Readline = require('../lib/Readline.js');


describe('Readline', function() {

  describe('constructor', function() {
    it('should read lines into `lines` property after ready', function(done) {
      var readline = new Readline('./word_frequency.csv', function() {
        expect(typeof readline.lines).to.equal('object');
        expect(readline.lines[0]).to.equal('love,52605');
        expect(readline.lines[readline.lines.length - 1]).to.equal('butterscotch,214');
        expect(readline.lines.length).to.equal(11082);
        done();
      });
    });

    it('should init `cursor` after ready', function(done) {
      var readline = new Readline('./word_frequency.csv', function() {
        expect(readline.cursor).to.equal(0);
        done();
      });
    });
  });


  describe('nextLine()', function() {
    it('should call callback with next line on each call', function(done) {
      var readline = new Readline('./word_frequency.csv');
      readline.nextLine(function(line) {
        expect(line).to.equal('love,52605');

        readline.nextLine(function(line) {
          expect(line).to.equal('you,32694');
          done();
        });
      });
    });

    it('should increase cursor after being called', function(done) {
      var readline = new Readline('./word_frequency.csv');
      readline.nextLine(function(line) {
        expect(readline.cursor).to.equal(1);

        readline.nextLine(function(line) {
          expect(readline.cursor).to.equal(2);
          done();
        });
      });
    });
  });
});
