"use strict";

function Asserts(onFailure) {
	this.executed = [];
	this.onFailure = onFailure || function () {};
}

Asserts.prototype = {
	fail: function (name, expected, actual) {
		this.onFailure({
			name: name,
			expected: expected,
			actual: actual
		});
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
