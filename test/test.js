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
		func: function () {
			test.ok(true);
			this.assertTrue(true);
			this.assertEqual("Hiro", "Hiro");
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
		func: function () {
			test.ok(true);
			this.assertTrue(false);
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
		func: function () {
			test.ok(true);
			this.pause();
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
		func: function () {
			test.ok(true);
			this.pause();

			_.defer(_.bind(function () {
				this.assertTrue(false);
			}, this));
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
		func: function () {
			test.ok(true);
			this.pause();
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

window.tests = exports;
