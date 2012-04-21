function Test(opts) {
	this.name    = opts.name;
	this.func    = opts.func;
	this.timeout = opts.timeout || 250;
	this.args    = [];
	this.status  = READY;
	this.report  = {
		success: null
	};

	this.asserts = new Asserts(_.bind(function (details) {
		this.fail();
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

		if (err !== null)
			return void self.fail();

		// Put the test into a paused mode and set a timer to fail the
		// test after certain period of time.

		if (self.status === DONE)
			return;

		if (self.status === PAUSED) {
			_.delay(function () {
				if (self.status === PAUSED)
					self.fail();
			}, self.timeout);

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

