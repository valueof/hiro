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
	},

	assertUndefined: function (val) {
		this[val === void 0 ? "done" : "fail"]("assertUndefined", undefined, val);
	},

	assertNull: function (val) {
		this[val === null ? "done" : "fail"]("assertNull", null, val);
	},

	assertOwnProperty: function (obj, prop) {
		var ret = _.has(obj, prop);
		this[ret ? "done" : "fail"]("assertOwnProperty", "(object)", ret);
	},

	assertIndexOf: function (arr, el) {
		var ret = _.indexOf(arr, el);
		this[ret > -1 ? "done" : "fail"]("assertIndexOf", "> -1", ret);
	}
};
