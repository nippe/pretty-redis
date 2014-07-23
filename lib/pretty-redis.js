'use strict';

var util = require('util');
var redis = require('redis');
var Promise = require('native-or-bluebird');
var Emitter = require('events').EventEmitter;

module.exports = function (port, host, args) {
  return new PrettyRedis(port, host, args);
};

function PrettyRedis(port, host, args) {
  Emitter.call(this);
  this.client = redis.createClient(port, host, args);
}

util.inherits(PrettyRedis, Emitter);

PrettyRedis.prototype.exec = function (line) {
  var action = this.parse(line);
  var res, err;

  var emit = this.emit.bind(this);

  var getRes = function (data) {
    res = data;
    emit('data', data, action);
  };

  var getErr = function (e) {
    err = e;
    emit('error', e);
  };

  var done = function () {
    if (err) {
      throw err;
    }
    return res;
  };

  return this.cmd(action.cmd, action.args)
    .then(getRes)
    .catch(getErr)
    .then(done);
};

PrettyRedis.prototype.cmd = function (cmd, args) {
  var client = this.client;

  return new Promise(function (resolve, reject) {
    if (!client[cmd]) {
      return reject(new Error('Command not found: ' + cmd));
    }

    var cb = function (err, result) {
      if (err) {
        return reject(err);
      }
      resolve(result);
    };

    args.push(cb);

    client[cmd].apply(client, args);
  });
};

PrettyRedis.prototype.parse = function (line) {
  var args = line.split(/\s/);
  var cmd = args.shift().toLowerCase();

  line = args.join(' ');
  args = [];

  var c = '';
  var buffer = '';
  var quote = false;
  var cursor = 0;
  var len = line.length;
  var isQuote, escape, space;

  while (1) {
    c = line[cursor];

    if (c === '\\') {
      escape = !escape;
      cursor += 1;
      continue;
    }

    isQuote = !escape && (c === '"' || c === '\'');

    if (quote) {
      if (c === quote) {
        args.push(buffer);
        buffer = '';
        quote = false;
      }
    } else {
      if (isQuote) {
        quote = c;
      }
    }

    if (quote && buffer) {
      buffer += c;
    } else if (!isQuote) {
      if (/\s/.test(c)) {
        while (/\s/.test(line[cursor + 1])) {
          cursor += 1;
        }
        args.push(buffer);
        buffer = '';
      } else {
        buffer += c;
      }
    }

    cursor += 1;
    escape = false;

    if (cursor >= len) {
      if (buffer) {
        args.push(buffer);
      }
      break;
    }
  }

  return {
    cmd: cmd,
    args: args
  };
};
