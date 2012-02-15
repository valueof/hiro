/*!
 * Copyright (c) 2011 Anton Kovalyov, http://hirojs.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*jshint loopfunc:true */

var hiro = (function (window, undefined) {
	"use strict";

	var document     = window.document;
	var setTimeout   = window.setTimeout;
	var clearTimeout = window.clearTimeout;
	var TIMEOUT      = 15000; // Default timeout for test cases and suites
	var suites       = {};
	var events       = {
		'hiro.onStart':     [], // no arguments
		'hiro.onComplete':  [], // (success, report)

		'suite.onSetup':    [], // (suite)
		'suite.onStart':    [], // (suite)
		'suite.onComplete': [], // (suite, success, report)
		'suite.onTimeout':  [], // (suite)

		'test.onStart':     [], // (test)
		'test.onFailure':   [], // (test, report)
		'test.onComplete':  [], // (test, success, report)
		'test.onTimeout':   []  // (test)
	};

	var Suite;
	var Test;
	var Failure = function () {};

	function each(obj, callback) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) callback(obj[key], key);
		}
	}

	function timestamp() {
		var date = new Date();
		var args = [
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate(),
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds(),
			date.getUTCMilliseconds()
		];
		return Date.UTC.apply(null, args);
	}

	function getSuite(name) {
		return suites[name];
	}


	// Attempts to retrieve affected line from stack trace.
	// Taken from QUnit, so far supports only Firefox, Chrome
	// and Opera (buggy).

	function getAffectedLine() {
		try {
			throw new Error();
		} catch (exc) {
			if (exc.stacktrace)
				return exc.stacktrace.split('\n')[7]; // Opera
			else if (exc.stack)
				return exc.stack.split('\n')[5];      // Firefox, Chrome
		}
	}

	// People can load fixtures either by injecting HTML into
	// an iframe or by loading another page inside of it. Note,
	// that the page has to be on the same domain or we won't
	// be able to grab objects from inside the iframe.

	function getFixture(opts) {
		// Backwards compatibility
		if (typeof opts == 'string')
			opts = { data: opts };

		if (opts.url)
			return { type: 'url', data: opts.url };

		var els = document.getElementsByTagName('script');
		var len = els.length;
		var el;

		for (var i = 0; i < len; i++) {
			el = els[i];
			if (el.getAttribute('type') == 'hiro/fixture' &&
					el.getAttribute('data-name') == opts.data)
				return { type: 'text', data: el.innerHTML };
		}

		// We used to use textarea.fixture[data-name=<name>] before,
		// checking these elements for backwards compatibility.
		els = document.getElementsByTagName('textarea');
		len = els.length;

		for (i = 0; i < len; i++) {
			el = els[i];
			if (el.className == 'fixture' &&
					el.getAttribute('data-name') == opts.data)
				return { type: 'text', data: el.value };
		}
	}

	Suite = function (name, methods) {
		/*jshint boss: true */

		this.name     = name;
		this.report   = {};
		this.methods  = {};
		this.length   = 0;
		this.env      = null;
		this.status   = null;
		this.snapshot = null;

		// Refs to the sandboxed environment
		this.frame    = null;
		this.window   = null;
		this.document = null;

		var self = this;

		if (methods.mixin && methods.mixin.length) {
			for (var i = 0, suiteName; suiteName = methods.mixin[i]; i++) {
				each(suites[suiteName].methods, function (value, key) {
					self.methods[key] = value;

					if (typeof value  == 'function' && key.slice(0, 4) == 'test')
						self.length += 1;
				});
			}
		}

		each(methods, function (value, key) {
			self.methods[key] = value;

			if (typeof value == 'function' && key.slice(0, 4) == 'test')
				self.length += 1;
		});
	};

	Suite.prototype = {
		setUp_: function () {
			var self = this;

			hiro.trigger('suite.onSetup', [ this ]);

			// If user provided a setUp method, call it (this is their chance
			// to load any fixtures)
			if (self.methods.setUp)
				self.methods.setUp.apply(self);

			function append() {
				document.body.appendChild(self.frame);

				// Save references to the sandboxed environment
				self.window   = self.frame.contentWindow;
				self.document = self.window.document;
			}

			// If user loaded a fixture, create a sandboxed environment with an
			// iframe and document.write that fixture into it.
			if (self.env && self.env.type) {
				self.frame = document.createElement('iframe');
				self.frame.id = 'hiro_fixture_' + this.name;
				self.frame.style.position = 'absolute';
				self.frame.style.top = '-2000px';

				if (self.env.type == 'url') {
					self.frame.src = self.env.data;
					append();
				} else if (self.env.type == 'text') {
					append();

					// We need to document.close right away or Internet Explorer hangs
					// when injected code tries to load external resources.
					self.document.write(self.env.data);
					self.document.close();
				}
			}

			if (self.methods.onTest) {
				self.onTest_ = function (test) {
					if (test.suite.name != self.name)
						return;

					try {
						self.methods.onTest.apply(test);
					} catch (exc) {
						try {
							test.fail_({ assertion: 'onTest', result: exc.toString() });
						} catch (e) {
							if (!(e instanceof Failure))
								throw e;
						}
					}
				};

				hiro.bind('test.onStart', self.onTest_);
			}

			if (self.methods.waitFor) {
				self.status = 'waiting';
				self.snapshot = timestamp();

				var interval = setInterval(function () {
					if (self.status != 'waiting')
						return;

					if (self.methods.waitFor.apply(self)) {
						self.snapshot = null;
						self.status = 'ready';
						clearInterval(interval);
					}
				}, 100);

				return;
			}

			self.status = 'ready';
		},

		timedout_: function () {
			if (!this.snapshot)
				return false;

			return (timestamp() - this.snapshot) > TIMEOUT;
		},

		complete_: function () {
			if (this.status == 'finished') {
				// Tear down
				if (this.frame) {
					this.window = null;
					this.document = null;
					document.body.removeChild(this.frame);
				}

				if (this.methods.onTest) {
					hiro.unbind('test.onStart', this.onTest_);
				}

				this.status = 'done';
			}

			if (this.timedout_()) {
				hiro.trigger('suite.onTimeout', [ this ]);
				return false;
			}

			for (var name in this.report) {
				if (!this.report[name]) {
					hiro.trigger('suite.onComplete', [ this, false ]);
					return false;
				}
			}

			hiro.trigger('suite.onComplete', [ this, true ]);
			return true;
		},

		loadFixture: function (opts) {
			this.env = getFixture(opts);
		},

		run: function (testName) {
			/*jshint boss:true */

			var self  = this;
			var queue = [];
			var test;

			if (!testName) {
				// Push all available tests to the queue
				each(self.methods, function (method, name) {
					if (typeof method == 'function' && name.slice(0, 4) == 'test')
						queue.push(new Test(name, method, self));
				});
			} else {
				queue = [ new Test(testName, self.methods[testName], self) ];
			}

			hiro.trigger('suite.onStart', [ this ]);
			test = queue.shift();
			self.status = 'running';
			self.snapshot = timestamp();

			var interval = setInterval(function () {
				if (test == null) {
					self.status = 'finished';
					return clearInterval(interval);
				}

				// Test is ready to be executed
				if (test.status == 'ready')
					test.run();

				// Test may put the suite into the running mode by pausing themselves
				// (usually when they wait for async callbacks)
				if (test.status == 'running' && test.timedout_())
					test.status = 'done';

				// Test is done executing
				if (test.status == 'done') {
					self.report[test.name] = test.complete_();
					test = queue.shift();
					self.snapshot = timestamp();
				}
			}, 100);
		}
	};

	Test = function (name, func, suite) {
		this.name     = name;
		this.func     = func;
		this.suite    = suite;
		this.status   = 'ready';
		this.failed   = false;
		this.paused   = false;
		this.snapshot = null;
		this.args     = [];

		this.window   = this.suite.window;
		this.document = this.suite.document;

		this.asserts_ = {
			check:    false,
			expected: 0,
			actual:   0
		};
	};

	Test.prototype = {
		fail_: function (report) {
			report.position = this.asserts_.actual;
			report.source = getAffectedLine();

			hiro.trigger('test.onFailure', [ this, report ]);
			this.failed = true;
			throw new Failure();
		},

		timedout_: function () {
			if (!this.snapshot)
				return false;

			return (timestamp() - this.snapshot) > TIMEOUT;
		},

		complete_: function () {
			if (this.timedout_()) {
				hiro.trigger('test.onTimeout', [ this ]);
				return false;
			}

			if (this.suite.methods.onCleanup) {
				try {
					this.suite.methods.onCleanup.apply(this);
				} catch (exc) {
					try {
						this.fail_({ assertion: 'onComplete', result: exc.toString() });
					} catch (e) {
						if (!(e instanceof Failure))
							throw e;
					}
				}
			}

			if (this.failed) {
				hiro.trigger('test.onComplete', [ this, false ]);
				return false;
			}

			var chk = this.asserts_.check;
			var exp = this.asserts_.expected;
			var act = this.asserts_.actual;

			if (chk && exp != act) {
				// TODO: Add number of tests ran
				hiro.trigger('test.onComplete', [ this, false ]);
				return false;
			}

			hiro.trigger('test.onComplete', [ this, true ]);
			return true;
		},

		getFixture: function (opts) {
			// TODO: XHR whatever is on other side of the URL
			return getFixture(opts).data;
		},

		expect: function (num) {
			this.asserts_.check = true;
			this.asserts_.expected = num;
		},

		run: function () {
			hiro.trigger('test.onStart', [ this ]);

			if (!this.failed) {
				this.status = 'running';

				try {
					this.func.apply(this, this.args);
				} catch (exc) {
					if (!(exc instanceof Failure))
						throw exc;
				}

				this.snapshot = timestamp();
			}

			if (!this.paused)
				this.status = 'done';
		},

		pause: function () {
			this.paused = true;
		},

		resume: function () {
			this.paused = false;
			if (this.status == 'running')
				this.status = 'done';
		},

		toString: function () {
			return this.suite.name + '.' + this.name;
		}
	};

	var asserts = {
		assertTrue: function (value) {
			if (value)
				return;

			this.fail_({ assertion: 'assertTrue', expected : true, result: value });
		},

		assertFalse: function (value) {
			if (!value)
				return;

			this.fail_({ assertion: 'assertFalse', expected : false, result: value });
		},

		assertEqual: function (actual, expected) {
			if (expected === actual)
				return;

			this.fail_({
				assertion: 'assertEqual',
				expected: expected,
				result: actual
			});
		},

		assertNoException: function (func) {
			try {
				func();
			} catch (exc) {
				this.fail_({
					assertion: 'assertNoException',
					result: exc.toString()
				});
			}
		},

		assertException: function (func, expected) {
			try {
				func();

				this.fail_({
					assertion: 'assertException',
					expected:  expected ? expected.toString() : 'Exception',
					result:    null
				});
			} catch (exc) {
				if (expected && !(exc instanceof expected)) {
					this.fail_({
						assertion: 'assertException',
						expected: expected.toString(),
						result: exc.toString()
					});
				}
			}
		}
	};

	each(asserts, function (fn, name) {
		Test.prototype[name] = function () {
			this.asserts_.actual++;
			if (this.failed)
				return;
			fn.apply(this, arguments);
		};
	});

	return {
		// We're exposing private objects for unit tests.
		// NOBODY should use them outside of unit tests.
		internals_: {
			Suite:    Suite,
			Test:     Test,
			getSuite: getSuite,
			events:   events
		},

		changeTimeout: function (timeout) {
			TIMEOUT = timeout;
		},

		autorun: function () {
			var query = window.location.search.slice(1).split('.');
			var suite = query.length ? query[0] : undefined;
			var test  = query.length > 1 ? query[1] : undefined;

			hiro.run(suite, test);
		},

		module: function (name, methods) {
			suites[name] = new Suite(name, methods);
		},

		bind: function (name, handler) {
			if (events[name] === undefined)
				return false;

			events[name].push(handler);
			return true;
		},

		once: function (name, handler) {
			function wrapper() {
				handler.apply({}, arguments);
				hiro.unbind(name, wrapper);
			}

			return hiro.bind(name, wrapper);
		},

		unbind: function (name, handler) {
			/*jshint boss:true */

			if (events[name] === undefined)
				return;

			if (!handler) {
				events[name] = [];
				return;
			}

			for (var i = 0, h; h = events[name][i]; i++) {
				if (h === handler) {
					events[name].splice(i, 1);
					return;
				}
			}
		},

		trigger: function (name, args) {
			/*jshint boss:true */

			if (events[name] === undefined)
				return;

			for (var i = 0, handler; handler = events[name][i]; i++)
				handler.apply({}, args || []);
		},

		run: function (suiteName, testName) {
			/*jshint boss:true */

			var running = false;
			var queue   = [];
			var suite;

			if (!suiteName) {
				// Push all available suites to the queue but only if
				// they are not empty (i.e. with at least one test).
				for (var name in suites) {
					if (suites[name].length)
						queue.push(suites[name]);
				}
			} else {
				queue = [ suites[suiteName] ];
			}

			suite = queue.shift();
			hiro.trigger('hiro.onStart');

			var interval = setInterval(function () {
				if (suite == null) {
					hiro.trigger('hiro.onComplete');
					return clearInterval(interval);
				}

				// Suite hasn't been started yet. We need to reset necessary properties
				// and call user-defined setUp and waitFor methods (if any)
				if (suite.status === null)
					suite.setUp_();

				// If user specified waitFor it may put the suite into the waiting
				// status, meaning that we have to wait until user-provided condition
				// is met or until we hit the TIMEOUT value.
				if (suite.status == 'waiting' && suite.timedout_())
					suite.status = 'finished';

				// Suite is ready to be executed.
				if (suite.status == 'ready') {
					if (suiteName && testName)
						suite.run(testName);
					else
						suite.run();
				}

				// Tests may put the suite into the running mode by pausing themselves
				// (usually when they wait for asyncronous callbacks).
				if (suite.status == 'running' && suite.timedout_())
					suite.status = 'finished';

				// Suite is done executing (including async tests), we can do cleanup
				// and report the results.
				if (suite.status == 'finished')
					suite.complete_();

				// If suite is not done yet, don't proceed with the loop
				if (suite.status == 'done')
					suite = queue.shift();
			}, 100);
		}
	};
}(this));

/* vim: set ts=2 sw=2 noexpandtab: */
