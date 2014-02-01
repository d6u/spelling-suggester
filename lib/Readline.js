'use strict';


var fs = require('fs');
var EventEmitter = require('events').EventEmitter;


function Readline(path, readyCallback) {
  var _this = this;

  this._emitter = new EventEmitter();

  // callback will have current line string (without "\n") as arg
  this.nextLine = function(callback) {
    if (this.lines === undefined) {
      this._emitter.on('ready', function() {
        callback(_this.lines[_this.cursor++]);
      });
    } else {
      callback(_this.lines[_this.cursor++]);
    }
  };

  fs.open(path, 'r', function(err, fd) {
    if (err) throw err;
    fs.fstat(fd, function(err, stats) {
      if (err) throw err;
      var buffer = new Buffer(stats.size);
      fs.read(fd, buffer, 0, buffer.length, null, function(err, bytesRead, buf) {
        if (err) throw err;
        _this.lines = buf.toString().split("\n");
        _this.cursor = 0;
        if (readyCallback) readyCallback();
        _this._emitter.emit('ready');
        fs.close(fd);
      });
    });
  });
};


module.exports = Readline;
