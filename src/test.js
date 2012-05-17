"use strict";
/*jshint devel:true */

function Test(opts) {
	this.name     = opts.name;
	this.func     = opts.func;
	this.timeout  = opts.timeout || 250;
	this.args     = [];
	this.status   = READY;
	this.expected = null;
	this.report   = {
		success: null
	};

	this.asserts = new Asserts(_.bind(function (details) {
		this.fail(details);
	}, this));

	// Add shortcuts to all available assertions so that you could
	// access them via 'this'.

	_.each(Asserts.prototype, _.bind(function (_, name) {
		if (name.slice(0, 6) !== "assert")
			return;

		this[name] = function () {
			this.asserts[name].apply(this.asserts, arguments);
		};
	}, this));
}

Test.prototype = {
	run: function (context) {
		var self = this;
		var err;

		// Trigger all test.onStart listeners and fail the test if any of them
		// raise an exception.

		err = hiro.attempt(function () {
			hiro.trigger("test.onStart", [ self ]);
		});

		if (err !== null)
			return void self.fail({ source: "onStart", message: err });

		// Call the test case function and fail the test if it raises any
		// exceptions. If optional context has been provided bind the test
		// case to it.

		err = hiro.attempt(function () {
			self.func.apply(context || self, _.flatten([self, self.args], true));
		});

		if (err !== null)
			return void self.fail({ source: "Test case", message: err });

		// If test status is DONE it means that an assertion failed and
		// finished the test prematurely.

		if (self.status === DONE)
			return;

		// Put the test into a paused mode and set a timer to fail the
		// test after certain period of time.

		if (self.status === PAUSED) {
			_.delay(function () {
				if (self.status === PAUSED)
					self.fail({ source: "Test case", message: "Timeout limit exceeded." });
			}, self.timeout);

			return;
		}

		// Check that all expected assertions were executed. If self.expected
		// is null, user didn't set any expectations so we're golden.

		var exp = self.expected;
		var act = self.asserts.executed.length;

		if (exp !== null) {
			if (exp !== act) {
				self.fail({
					source: "Test case",
					message: "Only " + act + " out of " + exp + " assertions were executed."
				});

				return;
			}
		}

		// Finally, if we're here--declare this test a success and move on.
		self.success();
	},

	expect: function (num) {
		this.expected = num;
	},

	pause: function (timeout) {
		if (timeout)
			this.timeout = timeout;
		this.status = PAUSED;
	},

	resume: function () {
		if (this.status === DONE)
			return;

		this.success();
	},

	fail: function (details) {
		this.status = DONE;
		this.report.success = false;
		this.report = _.extend(this.report, details);

		hiro.attempt(function () {
			hiro.trigger('test.onComplete', [ this, false, this.report ]);
		}, this);
	},

	success: function () {
		this.status = DONE;
		this.report.success = true;

		hiro.attempt(function () {
			hiro.trigger('test.onComplete', [ this, true, this.report ]);
		}, this);
	},

	toString: function () {
		return this.name;
	}
};

