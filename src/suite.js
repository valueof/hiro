"use strict";

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

		// For backwards compatibility add a reference to
		// sandboxed window and document objects to the
		// suite itself.

		this.window   = this.sandbox.window;
		this.document = this.sandbox.document;
	},

	getFixture: function (name) {
		var sandbox = new Sandbox({ name: name });
		return sandbox.data;
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

		err = hiro.attempt(function () {
			if (_.isFunction(this.methods.setUp)) {
				this.methods.setUp.call(this);
			}
		}, this);

		if (err !== null)
			return void this.complete();

		// Select only functions that start with "test". Only these
		// functions will be treated as test cases. Then create a Test
		// object for each test method and place it in the queue.

		_.each(this.methods, _.bind(function (func, name) {
			if (name.slice(0, 4) !== "test" || !_.isFunction(func))
				return;

			var test = new Test({ name: name, func: func });
			this.queue.push(test);
		}, this));

		// If there is a special method 'waitFor' call it repeatedly
		// and wait until it returns true.

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
			}, this), 25);

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

			if (test === null || test === undefined) {
				this.complete();
				return void clearInterval(interval);
			}

			// If there is a test, check its status. If it's still running, keep waiting.
			// If it's paused, wait until it goes overtime. And if the test is done,
			// get the next one from the queue.

			switch (test.status) {
				case READY:
					if (_.isFunction(this.methods.onTest)) {

						// Call the onTest method and use its return results as arguments for
						// the actual test. If onTest raises an exception--fail the test.

						err = hiro.attempt(function () {
							test.args = this.methods.onTest.call(this) || test.args;
						}, this);

						if (err !== null) {
							test.fail({
								message: err,
								source: "onTest"
							});

							return;
						}
					}

					test.run(this);
					break;
				case DONE:
					this.report.tests[test.name] = test.report;
					test = this.queue.shift();
					break;
				default:
					// Wait until its done.
			}
		}, this), 25);
	},

	complete: function () {
		var success = _.all(this.report.tests, function (report) {
			return report.success;
		});

		this.status = DONE;
		hiro.trigger("suite.onComplete", [ this, success, this.report ]);
	}
};

