/*jshint globalstrict:true */
/*global require:false, phantom:false, console:false */

"use strict";

var fs       = require("fs");
var page     = require("webpage").create();
var stdout   = fs.open("/dev/stdout", "w");
var handlers = {};
var tests    = [];
var startTime;

function print(text) {
	stdout.write(text);
	stdout.flush();
}

function println(text) {
	print((text || "") + "\n");
}

function seventy(str) {
	return (new Array(70).join(str));
}


// Hiro handlers

handlers["hiro.onStart"] = function () {
	startTime = new Date();
	println("Running all tests...");
};

handlers["hiro.onComplete"] = function () {
	println();
	println();

	var failures = [];

	function printFail(test) {
		println(seventy("="));
		println("FAIL: " + test.name);
		println(seventy("-"));
		print("Assertion: " + test.report.name);
		println(" (" + test.report.expected + " != " + test.report.actual + ")");
		println();
	}

	function printError(test) {
		var msg = test.report.message;

		if (msg.message)
			msg = msg.message;

		println(seventy("="));
		println("ERROR: " + test.report.source);
		println(seventy("-"));
		println(msg);
		println();
	}

	for (var i = 0; i < tests.length; i++) {
		if (!tests[i].success) {
			failures.push(tests[i]);

			if (tests[i].report.message)
				printError(tests[i]);
			else
				printFail(tests[i]);
		}
	}

	println(seventy("-"));
	println("Ran " + tests.length + " tests in " + (new Date() - startTime) / 1000.0 + "s");
	println();

	if (failures.length)
		println("FAILED (failures=" + failures.length + ")");
	else
		println("OK");

	phantom.exit(failures.length ? 1 : 0);
};

handlers["test.onComplete"] = function (args) {
	if (!args)
		return;

	tests.push(args);

	if (args.success)
		print(".");
	else
		print(args.report.message ? "E" : "F");
};

// Phantom events

page.onInitialized = function () {
	/*global window:false */

	page.evaluate(function () {
		window.haunted = true;
	});
};

page.onConsoleMessage = function (ev) {
	ev = JSON.parse(ev);

	if (handlers[ev.eventName])
		handlers[ev.eventName](ev.data);
};

page.onError = function (msg) {
	println(msg);
};

// Parse arguments and open the page. Default value
// works if you run `make serve`.

(function (args) {
	var defpage = "http://localhost:7777/";
	var kwargs  = {};
	var arg, url;

	for (var i = 0; i < args.length; i++) {
		arg = args[i].split("=");
		kwargs[arg[0]] = arg.length > 1 ? arg[1] : null;
	}

	url = kwargs.page || defpage;
	page.open(url, function (status) {
		if (status !== "fail")
			return;

		console.log("FAILED to open page with URL: " + url);
		phantom.exit(1);
	});
})(phantom.args);
