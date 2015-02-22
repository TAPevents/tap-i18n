#!/usr/bin/env node
// Derived from: https://github.com/arunoda/travis-ci-meteor-packages/
var argv = process.argv.splice(2);
var test_dir = argv[0];
var port = argv[1] || 3000;

if (typeof test_dir === 'undefined') {
    console.log("Error: No test dir specified");
    
    process.exit(1);
}

var spawn = require('child_process').spawn;
var args = ['test-packages', '--driver-package', 'test-in-console', '-p', port, './'];

var meteor = spawn('mrt', args, {cwd: test_dir});
meteor.stdout.pipe(process.stdout);
meteor.stderr.pipe(process.stderr);
meteor.on('close', function (code) {
  console.log('meteor exited with code ' + code);
  process.exit(code);
});

meteor.stdout.on('data', function startTesting(data) {
  var data = data.toString();

  if(data.match(/Errors prevented startup/)) {
    meteor.kill();
    process.exit(1);
  } 
  if(data.match(new RegExp(port + '|test-in-console listening'))) {
    console.log('Test begin...');
    meteor.stdout.removeListener('data', startTesting);
    runTestSuite();
  } 
});

function runTestSuite() {
  process.env.URL = "http://localhost:" + port + "/"
  var phantomjs = spawn('phantomjs', ['./phantom_runner.js']);
  phantomjs.stdout.pipe(process.stdout);
  phantomjs.stderr.pipe(process.stderr);

  phantomjs.on('close', function(code) {
    console.log("Phantom closed with code: " + code + " - close meteor");
    
    meteor.kill();
    process.exit(code);
  });
}
