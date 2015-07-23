#!/usr/bin/env node

var async = require("./async");
var spawn = require('child_process').spawn;
var port = 3000;

var check_code_generator = function (expected_code) {
    return function (test_path, callback) {
        // console.log("Testing `" + test_path + "` exit with code " + expected_code);
        
        var test = spawn('./test-in-console.js', [test_path, (port = port + 3)], {cwd: __dirname});

        test.stdout.pipe(process.stdout);
        test.stderr.pipe(process.stderr);

        test.on('close', function (code) {
            if (code === expected_code) {
                console.log("✓ Test `" + test_path + "` exit with expected code: " + expected_code);
                return callback();
            }

            console.log("✕ Test `" + test_path + "` exit with wrong code " + code + ". Expected: " + expected_code);
            callback('error'); // failed
        });
    };
};

var check_succeed = check_code_generator(0);
var check_failed = check_code_generator(1);

var should_succeed = [
    "blank-package-tap-i18n",
    "custom-package-tap-i18n",
    "empty-object-package-tap-i18n",
    "pack-with-project-trans-tap-i18n",
    "project-all-custom-project-tap-i18n",
    "project-no-project-tap-i18n",
    "project-preload-all-langs"
];

var should_fail = [
    "project-with-translation-files-under-client-dir-SHOULD-FAIL",
    "project-with-translation-files-under-server-dir-SHOULD-FAIL"
];

async.series([
    function (callback) {
        async.eachSeries(should_succeed, check_succeed, function (err) {
            callback(err)
        });
    },
    function (callback) {
        async.eachSeries(should_fail, check_failed, function (err) {
            callback(err)
        });
    }
], function (err, result) {
    if (typeof err === 'undefined' || err === null) {
        console.log("✓ All Succeed");
        process.exit(0);
    }

    console.log("✕ Failed", err);
    process.exit(1);
});
