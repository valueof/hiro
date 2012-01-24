/*jshint smarttabs:true, strict:false */
/*global hiro:false */

hiro.module('GenericTests', {
	setUp: function () {
		this.loadFixture('hirojs');
	},

	waitFor: function () {
		return this.window.isReady;
	},

	onTest: function () {
		var hiro_ = this.window.hiro;
		this.args = [ hiro_, hiro_.internals_.Test, hiro_.internals_.Suite ];
	},

	/*
	 * Test basic assertions
	 */
	testAsserts: function (hiro_, Test, Suite) {
		var that = this;

		function test(fn) {
			var test_ = new Test('testDummy', fn, new Suite('test', {}));
			test_.run();
		}

		function Error() {}
		Error.prototype.toString = function () { return 'HerpDerp'; };
		function exc() { throw new Error(); }
		function noexc() { return; }

		this.expect(20);
		this.assertTrue(true);
		this.assertFalse(false);
		this.assertEqual('test', 'test');
		this.assertException(exc, Error);
		this.assertNoException(noexc);

		// assertTrue
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertTrue');
			that.assertEqual(report.result, false);
		});

		test(function () {
			this.assertTrue(false);
		});

		// assertFalse
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertFalse');
			that.assertEqual(report.result, true);
		});

		test(function () {
			this.assertFalse(true);
		});

		// assertEqual
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertEqual');
			that.assertEqual(report.expected, 'bar');
			that.assertEqual(report.result, 'foo');
		});

		test(function () {
			this.assertEqual('foo', 'bar');
		});

		// assertException without an exception
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertException');
			that.assertEqual(report.expected, 'Exception');
			that.assertEqual(report.result, null);
		});

		test(function () {
			this.assertException(noexc);
		});

		// assertException with unexpected exception
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertException');
			that.assertEqual(report.expected, 'WrongError');
			that.assertEqual(report.result, 'HerpDerp');
		});

		test(function () {
			function WrongError() {}
			WrongError.toString = function () { return 'WrongError'; };
			this.assertException(exc, WrongError);
		});

		// assertNoException with an exception
		hiro_.once('test.onFailure', function (test, report) {
			that.assertEqual(report.assertion, 'assertNoException');
			that.assertEqual(report.result, 'HerpDerp');
		});

		test(function () {
			this.assertNoException(exc);
		});
	},

	/*
	 * Make sure that we can access objects from the inside of sandbox,
	 * and that those objects don't have any effect on the outer
	 * environment.
	 */
	testSandbox: function () {
		var message = 'ping';
		var echo    = this.window.echo;

		this.expect(2);
		this.assertEqual(echo(message), message);
		this.assertTrue(window.echo == null);
	},

	/*
	 * Test async execution model (tests can pause the execution by calling
	 * the .pause() method; they have to call .resume() method afterwards)
	 */
	testAsyncExecution: function () {
		this.expect(1);

		var that = this;
		this.pause();

		setTimeout(function () {
			that.assertTrue(true);
			that.resume();
		}, 500);
	},

	/*
	 * Test getFixture method
	 */
	testGetFixture: function () {
		this.expect(1);
		this.assertEqual(this.getFixture('test'), 'Test.');
	}
});

hiro.module('TestRunnerTests', {
	setUp:   function () {
		this.loadFixture('hirojs');
	},

	waitFor: function () {
		return this.window.hiro != null;
	},

	onTest: function () {
		var hiro_ = this.window.hiro;
		this.args = [ hiro_, hiro_.internals_.Test, hiro_.internals_.Suite ];
	},

	testRun: function (hiro_, Test, Suite) {
		var that = this;

		function testCase() {
			this.expect(1);
			this.assertTrue(true);
			this.pause();
		}

		var test = new Test('testDummy', testCase, new Suite('test', {}));

		hiro_.changeTimeout(500);
		this.expect(23);

		// Test successful test

		hiro_.once('test.onStart', function (test) {
			that.assertEqual(test.name, 'testDummy');
		});

		hiro_.once('test.onComplete', function (test, success) {
			that.assertEqual(test.name, 'testDummy');
			that.assertTrue(success);
		});

		this.assertEqual(test.name, 'testDummy');
		this.assertEqual(test.status, 'ready');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.snapshot == null);

		test.run();
		this.assertEqual(test.status, 'running');
		this.assertTrue(test.snapshot != null);
		this.assertTrue(test.paused);

		test.resume();
		this.assertEqual(test.status, 'done');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.complete_());


		// Test timed out test

		hiro_.once('test.onStart', function (test) {
			that.assertEqual(test.name, 'testDummy');
		});

		hiro_.once('test.onTimeout', function (test) {
			that.assertEqual(test.name, 'testDummy');
		});

		test.status = 'ready';
		test.failed = false;
		test.paused = false;
		test.snapshot = null;

		test.run();
		this.assertEqual(test.status, 'running');
		this.assertTrue(test.snapshot != null);
		this.assertTrue(test.paused);

		this.pause();
		setTimeout(function () {
			that.assertTrue(test.timedout_());
			test.status = 'done';
			that.assertTrue(test.paused);
			that.assertFalse(test.complete_());
			that.resume();
		}, 1000);
	},

	testFailedRun: function (hiro_, Test, Suite) {
		var that = this;
		var test;

		function testCase() {
			this.expect(1);
			this.assertTrue(false);
		}

		test = new Test('testDummy', testCase, new Suite('test', {}));
		hiro_.changeTimeout(500);
		this.expect(11);

		hiro_.once('test.onComplete', function (test, success) {
			that.assertEqual(test.name, 'testDummy');
			that.assertFalse(success);
		});

		this.assertEqual(test.status, 'ready');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.snapshot == null);

		test.run();
		this.assertEqual(test.status, 'done');
		this.assertTrue(test.snapshot != null);
		this.assertFalse(test.paused);
		this.assertTrue(test.failed);

		this.assertFalse(test.complete_());
	},

	testNotAllAssertions: function (hiro_, Test, Suite) {
		var that = this;
		var test;

		function testCase() {
			this.expect(3);
			this.assertEqual("a", "a");
			this.assertTrue(true);
		}

		test = new Test('testDummy', testCase, new Suite('test', {}));
		hiro_.changeTimeout(500);
		this.expect(11);

		hiro_.once('test.onComplete', function (test, success) {
			that.assertEqual(test.name, 'testDummy');
			that.assertFalse(success);
			// TODO: Check for the report
		});

		this.assertEqual(test.status, 'ready');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.snapshot == null);

		test.run();
		this.assertEqual(test.status, 'done');
		this.assertTrue(test.snapshot != null);
		this.assertFalse(test.paused);
		this.assertFalse(test.failed);

		this.assertFalse(test.complete_());
	},

	testSkipAssertionsCheck: function (hiro_, Test, Suite) {
		var that = this;
		var test;

		function testCase() {
			this.assertTrue(true);
		}

		test = new Test('testDummy', testCase, new Suite('test', {}));
		hiro_.changeTimeout(500);
		this.expect(11);

		hiro_.once('test.onComplete', function (test, success) {
			that.assertEqual(test.name, 'testDummy');
			that.assertTrue(success);
		});

		this.assertEqual(test.name, 'testDummy');
		this.assertEqual(test.status, 'ready');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.snapshot == null);

		test.run();
		this.assertEqual(test.status, 'done');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);

		this.assertTrue(test.complete_());
	},

	testEventOnRun: function (hiro_, Test, Suite) {
		var suite = new Suite('test', {});
		var that  = this;
		var test;

		function testCase(a, b) {
			this.assertTrue(true);

			that.assertTrue(this.testValue);
			that.assertEqual(a, 1);
			that.assertEqual(b, 2);
		}

		test = new Test('testDummy', testCase, suite);

		suite.methods.onTest = function () {
			this.testValue = true;
			this.args = [1, 2];
		};

		suite.methods.onCleanup = function () {
			that.assertTrue(true);
		};

		suite.setUp_();

		hiro_.changeTimeout(500);
		this.expect(15);

		hiro_.once('test.onComplete', function (test, success) {
			that.assertEqual(test.name, 'testDummy');
			that.assertTrue(success);
		});

		this.assertEqual(test.name, 'testDummy');
		this.assertEqual(test.status, 'ready');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.snapshot == null);

		test.run();
		this.assertEqual(test.status, 'done');
		this.assertFalse(test.failed);
		this.assertFalse(test.paused);
		this.assertTrue(test.complete_());
	}
});

hiro.module('SuiteTests', {
	setUp:   function () {
		this.loadFixture('hirojs');
	},

	waitFor: function () {
		return this.window.hiro != null;
	},

	onTest: function () {
		var hiro_ = this.window.hiro;
		this.args = [ hiro_, hiro_.internals_.Test, hiro_.internals_.Suite ];
	},

	testRun: function (hiro_, Test, Suite) {
		var that  = this;
		var suite = new Suite('test', { testHello: function () {} });

		hiro_.changeTimeout(500);
		this.expect(9);

		hiro_.once('suite.onStart', function (suite) {
			that.assertEqual(suite.name, 'test');
		});

		hiro_.once('suite.onComplete', function (suite, success) {
			that.assertEqual(suite.name, 'test');
			that.assertTrue(success);
		});

		this.assertEqual(suite.name, 'test');
		this.assertTrue(typeof suite.methods.testHello == 'function');
		this.assertTrue(suite.status == null);

		suite.setUp_();
		this.assertEqual(suite.status, 'ready');

		suite.run();
		this.pause();

		setTimeout(function () {
			that.assertEqual(suite.status, 'finished');
			that.assertTrue(suite.complete_());
			that.resume();
		}, 300);
	},

	testMixin: function (hiro_, Test, Suite) {
		hiro_.module('parent', {
			testHello: function () {}
		});

		hiro_.module('child', {
			mixin:    ['parent'],
			testOhai: function () {}
		});

		var parent = hiro_.internals_.getSuite('parent');
		var child  = hiro_.internals_.getSuite('child');

		this.assertTrue(typeof parent.methods.testHello == 'function');
		this.assertTrue(parent.methods.testOhai == null);
		this.assertTrue(typeof child.methods.testHello == 'function');
		this.assertTrue(typeof child.methods.testOhai == 'function');
		this.assertEqual(child.methods.mixin[0], 'parent');
	}
});