var exports = {};

exports.setUp = function (fn) {
	this.hiro = new Hiro();
	fn();
};

exports.testConstructor = function (test) {
	test.expect(_.size(this.hiro.listeners) + 2);

	test.equal(this.hiro.status, 0); // READY
	test.equal(_.size(this.hiro.suites), 0);

	_.each(this.hiro.listeners, function (pool, name) {
		test.equal(pool.length, 0);
	});

	test.done();
};

exports.testEvents = function (test) {
	test.expect(3);

	function listener() {
		test.ok(true);
	}

	this.hiro.trigger("hiro.onStart"); // Listener shouldn't be called.

	this.hiro.bind("hiro.onStart", listener);
	this.hiro.trigger("hiro.onStart"); // Listener should be called.
	test.equal(this.hiro.listeners["hiro.onStart"].length, 1);

	this.hiro.unbind("hiro.onStart", listener);;
	this.hiro.trigger("hiro.onStart"); // Listener shouldn't be called.
	test.equal(this.hiro.listeners["hiro.onStart"].length, 0);

	test.done();
};

// TODO: Integration tests for the run() method.

window.hirojs = exports;
