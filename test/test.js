"use strict";

var exports = {};

exports.setUp = function (fn) {
	fn();
};

exports.testConstructor = function (test) {
	var fn = function () {};
	var testcase = new Test({
		name: "testSimple",
		func: fn
	});

	var asserts = [ "assertTrue", "assertFalse", "assertEqual", "assertException" ];

	test.expect(asserts.length + 6);

	test.equal(testcase.name, "testSimple");
	test.equal(testcase.func, fn);
	test.equal(testcase.args.length, 0);
	test.strictEqual(testcase.status, READY);
	test.deepEqual(testcase.report, { success: null });
	test.ok(testcase.asserts instanceof Asserts);

	_.each(asserts, function (name) {
		test.ok(_.has(testcase, name));
	});

	test.done();
};

exports.testSuccessfulTest = function (test) {
	test.expect(3);

	var testcase = new Test({
		name: "testSimple",
		func: function (ts) {
			test.ok(true);
			ts.assertTrue(true);
			ts.assertEqual("Hiro", "Hiro");
		}
	});

	testcase.run();
	test.equal(testcase.status, DONE);
	test.ok(testcase.report.success);

	test.done();
};

exports.testFailedTest = function (test) {
	test.expect(3);

	var testcase = new Test({
		name: "testSimple",
		func: function (ts) {
			test.ok(true);
			ts.assertTrue(false);
		}
	});

	testcase.run();
	test.equal(testcase.status, DONE);
	test.ok(!testcase.report.success);

	test.done();
};

exports.testPausedTest = function (test) {
	test.expect(5);

	var testcase = new Test({
		name: "testPaused",
		func: function (ts) {
			test.ok(true);
			ts.pause();
		}
	});

	testcase.run();
	test.equal(testcase.status, PAUSED);
	test.strictEqual(testcase.report.success, null);

	testcase.resume();
	test.equal(testcase.status, DONE);
	test.ok(testcase.report.success);

	test.done();
};

exports.testPausedFailedTest = function (test) {
	var testcase = new Test({
		name: "testPaused",
		func: function (ts) {
			test.ok(true);
			ts.pause();

			_.defer(function () {
				ts.assertTrue(false);
			});
		}
	});

	testcase.run();
	test.equal(testcase.status, PAUSED);

	_.defer(function () {
		testcase.resume();
		test.equal(testcase.status, DONE);
		test.ok(!testcase.report.success);

		test.done();
	});
};

exports.testTimedoutTest = function (test) {
	test.expect(4);

	var testcase = new Test({
		timeout: 50,
		name: "testPaused",
		func: function (ts) {
			test.ok(true);
			ts.pause();
		}
	});

	testcase.run();
	test.equal(testcase.status, PAUSED);

	_.delay(function () {
		test.equal(testcase.status, DONE);
		test.ok(!testcase.report.success);
		test.done();
	}, 100);
};

exports.testFailedExpect = function (test) {
	test.expect(2);

	var testcase = new Test({
		name: "testExpect",
		func: function (ts) {
			ts.expect(2);
			ts.assertTrue(true);
		}
	});

	testcase.run();
	test.equal(testcase.status, DONE);
	test.ok(!testcase.report.success);
	test.done();
};

window.tests = exports;
