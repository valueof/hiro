function Suite(name, methods) {
	this.name    = name;
	this.methods = methods;
	this.status  = READY;
	this.queue   = [];
	this.report  = {
		success: null,
		tests:   {}
	};
}

Suite.prototype = {
	loadFixture: function (opts) {
		this.sandbox = new Sandbox(opts);
		this.sandbox.append();
	},

	prepare: function (onReady) {
		onReady = onReady || function () {};
		this.status = WAITING;

		// Execute all listeners for suite.onSetup and pre-emptively
		// finish the suite if any of those listeners throws an
		// exception.

		var err = hiro.attempt(function () {
			hiro.trigger("suite.onSetup", [ this ]);
		}, this);

		if (err !== null)
			return void this.complete();

		// Select only functions that start with "test". Only these
		// functions will be treated as test cases.

		var methods = _.filter(this.methods, _.bind(function (func, name) {
			return name.slice(0, 4) === "test" && _.isFunction(func);
		}, this));

		// Create a Test object for each test method and place it in
		// the queue.

		this.queue = _.map(methods, function (func, name) {
			return new Test(name, func);
		});

		var interval;
		if (this.methods.waitFor && _.isFunction(this.methods.waitFor)) {
			interval = setInterval(_.bind(function () {
				if (this.status !== WAITING)
					return;

				if (this.methods.waitFor.apply(this)) {
					this.status = READY;
					clearInterval(interval);
					onReady();
				}
			}, this), 100);

			return;
		}

		this.status = READY;
		onReady();
	},

	run: function () {
		// Execute all listeners for suite.onStart and pre-emptively
		// finish the suite if any of those listeners throws an
		// exception.

		var err = hiro.attempt(function () {
			hiro.trigger("suite.onStart", [ this ]);
		}, this);

		if (err !== null)
			return void this.complete();

		this.status = RUNNING;

		var test = this.queue.shift();
		var interval = setInterval(_.bind(function () {
			// If there is no more tests to run, declare this suite completed.

			if (test === null) {
				this.complete();
				return void clearInterval(interval);
			}

			// If there is a test, check its status. If it's still running, keep waiting.
			// If it's paused, wait until it goes overtime. And if the test is done,
			// get the next one from the queue.

			if (test.status === READY)
				test.run();

			// TODO: Asynchronous tests

			if (test.status === DONE) {
				this.report.tests[test.name] = test.report;
				test = this.queue.shift();
			}
		}, this), 100);
	},

	complete: function () {
		var success = _.all(this.report.tests, function (report) {
			return report.success;
		});

		this.status = DONE;
		hiro.trigger("suite.onComplete", [ this, success, this.report ]);
	}
};
