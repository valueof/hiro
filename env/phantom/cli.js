/*jshint globalstrict:true */
/*global require:false, phantom:false, console:false */

"use strict";

var fs       = require('fs');
var page     = require('webpage').create();
var stdout   = fs.open('/dev/stdout', 'w');
var handlers = {};
var tests    = [];
var startTime;

function print(text) {
	stdout.write(text);
	stdout.flush();
}

function println(text) {
	print((text || '') + '\n');
}

function seventy(str) {
	return (new Array(70).join(str));
}


// Hiro handlers

handlers['hiro.onStart'] = function () {
	startTime = new Date();
	println('Running all tests...');
};

handlers['hiro.onComplete'] = function () {
	println();
	println();

	var failures = [];

	function printFail(test) {
		println(seventy('='));
		println('FAIL: ' + test.name);
		println(seventy('-'));
		print('Assertion: ' + test.assertion);
		println(' (' + test.expected + ' != ' + test.result + ')');
		println();
	}

	function printTimeout(test) {
		println(seventy('='));
		println('ERROR: ' + test.name + ' timed out');
		println(seventy('-'));
		println();
	}

	for (var i = 0; i < tests.length; i++) {
		if (!tests[i].success) {
			failures.push(tests[i]);

			if (tests[i].timeout)
				printTimeout(tests[i]);
			else
				printFail(tests[i]);
		}
	}

	println(seventy('-'));
	println('Ran ' + tests.length + ' tests in ' + (new Date() - startTime) / 1000.0 + 's');
	println();

	if (failures.length)
		println('FAILED (failures=' + failures.length + ')');
	else
		println('OK');

	phantom.exit(failures.length ? 1 : 0);
};

handlers['test.onComplete'] = function (args) {
	if (!args || !args.success)
		return;

	tests.push(args);
	print('.');
};

handlers['test.onFailure'] = function (args) {
	tests.push(args);
	print('F');
};

handlers['test.onTimeout'] = function (args) {
	tests.push(args);
	print('E');
};

// Phantom events

page.onInitialized = function () {
	page.evaluate(function () {
		window.haunted = true;
	});
};

page.onConsoleMessage = function (ev) {
	ev = JSON.parse(ev);

	if (handlers[ev.eventName])
		handlers[ev.eventName](ev.data);
};


// Parse arguments and open the page. Default value
// works if you run `make serve`.

(function (args) {
	var defpage = 'http://localhost:7777/test.html';
	var kwargs  = {};
	var arg, url;

	for (var i = 0; i < args.length; i++) {
		arg = args[i].split('=');
		kwargs[arg[0]] = arg.length > 1 ? arg[1] : null;
	}

	url = kwargs.page || defpage;
	page.open(url, function (status) {
		if (status == 'fail') {
			console.log('FAILED to open page with URL: ' + url);
			phantom.exit(1);
		}
	});
}(phantom.args));

/* vim: set ts=2 sw=2 noexpandtab: */
