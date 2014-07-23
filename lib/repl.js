'use strict';

var readline = require('readline');

module.exports = function () {
  var repl = readline.createInterface(process.stdin, process.stdout);

  repl.setPrompt(' › ');
  repl.prompt();

  repl.on('SIGINT', function () {
    console.log();
    process.exit(0);
  });

  return repl;
};
