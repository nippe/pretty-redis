#!/usr/bin/env node

var chalk = require('chalk');
var beautifyHTML = require('js-beautify').html;
var pkg = require('../package');
var prettyRedis = require('../lib/pretty-redis');
var repl = require('../lib/repl');
var parsed = require('../lib/opt');
var stop = {};

if (parsed.help) {
  console.log();
  console.log('  %s@%s', chalk.cyan(pkg.name), pkg.version);
  console.log();
  console.log('  %s %s -h %s -p %s'
    , chalk.yellow('$')
    , chalk.green('pretty-redis')
    , chalk.cyan('127.0.0.1')
    , chalk.cyan('6379'));
  console.log();
  console.log('  %s %s', '--help, -h\t', 'redis host name');
  console.log('  %s %s', '--port, -p\t', 'redis port number');
  console.log();
  process.exit();
}

var host = parsed.host || '127.0.0.1';
var port = parsed.port || 6379;

prettyRedis = prettyRedis(port, host);

repl = repl();

prettyRedis.on('error', function (err) {
  console.log();
  console.log('   ' + chalk.magenta(err.message));
  console.log();
  repl.prompt();
});

prettyRedis.on('data', function (data, action) {
  printKeys(data, action)
    || printSuccessMessage(data, action)
    || printJSON(data, action)
    || printHTML(data, action)
    || printArrayDefault(data, action)
    || printDataDefault(data, action);
  repl.prompt();
});

repl.on('line', prettyRedis.exec.bind(prettyRedis));

function printKeys(data, action) {
  if (action.cmd !== 'keys') {
    return;
  }

  if (!data.length) {
    console.log();
    console.log(chalk.magenta('   Sorry, no results found.'));
    console.log();
    return stop;
  }

  var tree = {};

  var push = function (key) {
    var tmp = key.split(':');
    var last = tmp.pop();
    var parent_ = tree;

    tmp.forEach(function (key) {
      if (!parent_.hasOwnProperty(key)) {
        parent_[key] = {};
      }
      parent_ = parent_[key];
    });

    parent_[last] = null;
  };

  data.forEach(push);

  var log = function (indent, msg) {
    while (indent--) {
      msg = ' ' + msg;
    }
    console.log(msg);
  }

  var printTree = function (indent, prefix, tree) {
    var keys = Object.keys(tree);
    var counter = 0;

    if (!keys.length) {
      return;
    }
    
    keys.forEach(function (key, index) {
      if (tree[key]) {
        log(indent, chalk.yellow(prefix + key));
        printTree(indent + 2, prefix + key + ':', tree[key]);
      } else {
        log(indent, (counter++) + ') ' + chalk.cyan(prefix + key));
      }
    });
  };

  console.log();
  printTree(3, '', tree);
  console.log();

  return stop;
}

function printJSON(data, action) {
  if (typeof data !== 'string') {
    return;
  }

  data = data.trim();

  if (!/^[\[{]/.test(data)) {
    return;
  }

  try {
    data = JSON.parse(data);
  } catch (e) {
    return;
  }

  data = JSON.stringify(data, null, 2);
  data = data.replace(/^/gm, '   ');

  console.log();
  console.log(chalk.cyan('   (json)'));
  console.log();
  console.log(data);
  console.log();

  return stop;
}

function printHTML(data, action) {
  if (!/^\s*\<.+?\>/.test(data)) {
    return;
  }

  data = beautifyHTML(data, {
    indent_size: 2
  });

  data = data.replace(/^/gm, '   ');

  console.log();
  console.log(chalk.cyan('   (html)'));
  console.log();
  console.log(data);
  console.log();

  return stop;
}

function printSuccessMessage(data, action) {
  if (!/^ok$/i.test(data)) {
    return;
  }

  console.log();
  console.log('   ' + chalk.green(data));
  console.log();

  return stop;
}

function printArrayDefault(data, action) {
  if (!Array.isArray(data)) {
    return;
  }

  data.forEach(function (val, index) {
    var msg = '   '
      + index + ') '
      + chalk.cyan(val);

    console.log(msg);
  });
}

function printDataDefault(data, action) {
  console.log();
  console.log('   %s %s', chalk.cyan('(' + (typeof data) + ')'), data);
  console.log();
}
