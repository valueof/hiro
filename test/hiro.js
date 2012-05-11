"use strict";

var exports = {};

exports.setUp = function (fn) {
	this.hiro = new Hiro();
	fn();
};

exports.testConstructor = function (test) {
	test.expect(_.size(this.hiro.listeners) + 2);

	test.equal(this.hiro.status, 0); // READY
	test.equal(_.size(this.hiro.suites), 0);

	_.each(this.hiro.listeners, function (pool, name) {
		test.equal(pool.length, 0);
	});

	test.done();
};

exports.testEvents = function (test) {
	test.expect(4);

	function listener(param) {
		test.ok(true);
		test.equal(param, "Hiro Protagonist");
	}

	this.hiro.trigger("hiro.onStart"); // Listener shouldn't be called.

	this.hiro.bind("hiro.onStart", listener);
	this.hiro.trigger("hiro.onStart", [ "Hiro Protagonist" ]); // Listener should be called.
	test.equal(this.hiro.listeners["hiro.onStart"].length, 1);

	this.hiro.unbind("hiro.onStart", listener);
	this.hiro.trigger("hiro.onStart"); // Listener shouldn't be called.
	test.equal(this.hiro.listeners["hiro.onStart"].length, 0);

	test.done();
};

exports.testRun = function (test) {
	test.expect(9);

	hiro.bind("hiro.onComplete", function () {
		test.done();
	});

	hiro.module("EmptySuite", {});

	hiro.module("ParentSuite", {
		testZero: function () {
			test.ok(true, "testZero");
		}
	});

	hiro.module("MySuite", {
		mixin: [ "EmptySuite", "ParentSuite" ],

		setUp: function () {
			test.ok(true, "setUp");
		},

		waitFor: function () {
			test.ok(true, "waitFor");
			return true;
		},

		onTest: function () {
			test.ok(true, "onTest"); // This should be called three times.
		},

		testOne: function () {
			test.ok(true, "testOne");
		},

		testTwo: function () {
			test.ok(true, "testTwo");
		}
	});

	hiro.run();
};

window.hirojs = exports;
