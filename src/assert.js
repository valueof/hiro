function Failure(name, expected, actual) {
	this.name     = name;
	this.expected = expected;
	this.actual   = actual;
}

function Asserts() {
	this.executed = [];
}

Asserts.prototype = {
	fail: function (name, expected, actual) {
		throw new Failure(name, expected, actual);
	},

	done: function (name, expected, actual) {
		this.executed.push({
			name: name,
			expected: expected,
			actual: actual
		});
	},

	assertTrue: function (val) {
		this[val ? "done" : "fail"]("assertTrue", true, val);
	},

	assertFalse: function (val) {
		this[val ? "fail" : "done"]("assertFalse", false, val);
	},

	assertEqual: function (expected, actual) {
		var ok = _.isEqual(actual, expected);
		this[ok ? "done" : "fail"]("assertEqual", expected, actual);
	},

	assertException: function (func, expected) {
		var err = hiro.attempt(func);
		var ok  = err && err instanceof expected;
		this[ok ? "done" : "fail"]("assertException", expected, err || null);
	}
};
