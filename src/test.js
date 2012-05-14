"use strict";

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

		// If there is no context, create an Asserts module and add it to the
		// test.

		if (context === undefined) {
			self.asserts = new Asserts(function (details) {
				self.fail(details);
			});

			self.asserts.createShortcuts(self, self);
		}

		// Call the test case function and fail the test if it raises any
		// exceptions. If optional context has been provided bind the test
		// case to it.

		err = hiro.attempt(function () {
			self.func.apply(context || self, self.args);
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
					self.fail();
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

	pause: function () {
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

