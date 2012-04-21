"use strict";

var exports = {};

exports.testConstructor = function (test) {
	var suite = new Suite("SimpleSuite", {});

	test.equal(suite.name, "SimpleSuite");
	test.equal(suite.status, READY);
	test.deepEqual(suite.methods, {});
	test.equal(suite.queue.length, 0);
	test.deepEqual(suite.report, { success: null, tests: {} });

	test.done();
};

exports.testPrepare = function (test) {
	var isReady       = false;
	var waitForCalled = false;
	var onReadyCalled = false;

	var suite = new Suite("SimpleSuite", {
		waitFor: function () {
			waitForCalled = true;
			return isReady;
		},

		testSimple: function () {
		}
	});

	var onReady = function () {
		onReadyCalled = true;
	};

	suite.prepare(onReady);
	test.equal(suite.status, WAITING);
	test.equal(suite.queue.length, 1);

	isReady = true;
	_.delay(function () {
		test.ok(waitForCalled);
		test.equal(suite.status, READY);
		test.ok(onReadyCalled);
		test.done();
	}, 100);
};

exports.testRun = function (test) {
	test.expect(3);

	var suite = new Suite("SimpleSuite", {
		testSimple: function () {
			test.ok(true);
			this.assertTrue(true);
		}
	});

	suite.prepare(function () {
		suite.run();
	});

	_.delay(function () {
		test.equal(suite.status, DONE);
		test.ok(suite.report.tests.testSimple.success);
		test.done();
	}, 100);
};

exports.testFailedRun = function (test) {
	var suite = new Suite("FailedSuite", {
		testSuccess: function () {
			this.assertTrue(true);
		},

		testFailure: function () {
			this.assertTrue(false);
		}
	});

	suite.prepare(function () {
		suite.run();
	});

	_.delay(function () {
		test.equal(suite.status, DONE);
		test.ok(suite.report.tests.testSuccess.success);
		test.ok(!suite.report.tests.testFailure.success);
		test.done();
	}, 200);
};

window.suites = exports;
