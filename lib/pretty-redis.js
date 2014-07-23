'use strict';

var util = require('util');
var redis = require('redis');
var Promise = require('native-or-bluebird');
var Emitter = require('events').EventEmitter;
var parse = require('str2argv');

module.exports = function (port, host, args) {
  return new PrettyRedis(port, host, args);
};

function PrettyRedis(port, host, args) {
  Emitter.call(this);
  this.client = redis.createClient(port, host, args);
}

util.inherits(PrettyRedis, Emitter);

PrettyRedis.prototype.exec = function (line) {
  line = line.trim();

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
  var argv = parse(line);
  var cmd = argv.shift().toLowerCase();

  return {
    cmd: cmd,
    args: argv
  };
};
