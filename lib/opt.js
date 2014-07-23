'use strict';

var nopt = require('nopt')

var knownOpts = {
  help: Boolean,
  host: String,
  port: Number
};

var shortHands = {
  p: ['--port'],
  h: ['--host']
};

var parsed = nopt(knownOpts, shortHands, process.argv, 2);

module.exports = parsed;
