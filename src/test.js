function Test(name, func) {
	this.name   = name;
	this.func   = func;
	this.args   = [];
	this.status = READY;
	this.report = {
		success: null
	};

	this.asserts = new Asserts();
	_.extend(this, _.filter(this.asserts, function (_, name) {
		return name.slice(0, 6) === "assert"
	});
}

Test.prototype = {
	run: function () {
		var that = this;
		var err;

		// Trigger all test.onStart listeners and fail the test if any of them
		// raise an exception.

		err = hiro.attempt(function () {
			hiro.trigger('test.onStart', [ this ]);
		}, this);

		if (err !== null)
			return void that.fail();

		// Call the test case function and fail the test if it raises any
		// exceptions.

		err = hiro.attempt(function () {
			this.func.apply(this, this.args);
		}, this);

		if (err !== null)
			return void that.fail();

		// If, after executing the test case function, our status is PAUSED
		// save the timestamp and return. We will need this timestamp to
		// fail the test if it's running overtime.

		if (that.status === PAUSED) {
			// TODO: Save the timestamp.
			return;
		}

		// Finally, if we're here--declare this test a success and move on.
		this.success();
	},

	pause: function () {
		this.status = PAUSED;
	},

	resume: function () {
		this.status = RUNNING;
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

