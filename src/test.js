function Test(name, func) {
	this.name   = name;
	this.func   = func;
	this.args   = [];
	this.status = READY;
	this.report = {
		success: null
	};

	this.asserts = new Asserts(_.bind(function (details) {
		this.fail();
	}, this));

	_.each(Asserts.prototype, _.bind(function (_, name) {
		if (name.slice(0, 6) !== "assert")
			return;
		this[name] = function () {
			this.asserts[name].apply(this.asserts, arguments);
		};
	}, this));
}

Test.prototype = {
	run: function () {
		var self = this;
		var err;

		// Trigger all test.onStart listeners and fail the test if any of them
		// raise an exception.

		err = hiro.attempt(function () {
			hiro.trigger('test.onStart', [ self ]);
		});

		if (err !== null)
			return void self.fail();

		// Call the test case function and fail the test if it raises any
		// exceptions.

		err = hiro.attempt(function () {
			self.func.apply(self, self.args);
		}, self);

		if (self.status === DONE)
			return;

		if (err !== null)
			return void self.fail();

		// If, after executing the test case function, our status is PAUSED
		// save the timestamp and return. We will need this timestamp to
		// fail the test if it's running overtime.

		if (self.status === PAUSED) {
			// TODO: Save the timestamp.
			return;
		}

		// Finally, if we're here--declare this test a success and move on.
		self.success();
	},

	pause: function () {
		this.status = PAUSED;
	},

	resume: function () {
		if (this.status === DONE)
			return;

		this.success();
	},

	fail: function () {
		this.status = DONE;
		this.report.success = false;
	},

	success: function () {
		this.status = DONE;
		this.report.success = true;
	},

	toString: function () {
		return this.name;
	}
};

