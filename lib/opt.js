'use strict';

var nopt = require('nopt')

var knownOpts = {
  help: Boolean,
  host: String,
  port: Number,
  auth: String
};

var shortHands = {
  p: ['--port'],
  h: ['--host'],
  a: ['--auth']
};

var parsed = nopt(knownOpts, shortHands, process.argv, 2);

module.exports = parsed;
