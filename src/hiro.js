"use strict";

var READY   = 0;
var WAITING = 1;
var RUNNING = 2;
var PAUSED  = 3;
var DONE    = 4;

var Hiro = function () {
	this.status = READY;
	this.suites = {};
	this.listeners = {
		"hiro.onStart":     [], // no arguments
		"hiro.onComplete":  [], // no arguments

		"suite.onSetup":    [], // (suite)
		"suite.onStart":    [], // (suite)
		"suite.onComplete": [], // (suite, success, report)

		"test.onStart":     [], // (test)
		"test.onComplete":  []  // (test, success, report)
	};
};

Hiro.prototype = {
	bind: function (name, listener) {
		if (this.listeners[name] === undefined)
			return;

		this.listeners[name].push(listener);
	},

	unbind: function (name, listener) {
		if (this.listeners[name] === undefined)
			return;

		this.listeners[name] = _.filter(this.listeners[name], function (fn) {
			return fn !== listener;
		});
	},

	trigger: function (name, args) {
		if (this.listeners[name] === undefined)
			return;

		_.each(this.listeners[name], function (fn) {
			fn.apply(fn, args);
		});
	},

	attempt: function (fn, obj) {
		obj = obj || {};

		try {
			_.bind(fn, obj)();
		} catch (exc) {
			return exc;
		}

		return null;
	},

	module: function (name, methods) {
		var mixin = [];

		if (_.isArray(methods.mixin)) {
			mixin = _.map(methods.mixin, _.bind(function (n) {
				if (this.suites[n] === undefined)
					return {};

				return this.suites[n].methods;
			}, this));

			delete methods.mixin;
		}

		mixin.splice(0, 0, {});
		mixin.push(methods);

		this.suites[name] = new Suite(name, _.extend.apply(_, mixin));
	},

	run: function () {
		var self = this;

		self.status = RUNNING;

		self.attempt(function () {
			self.trigger("hiro.onStart");
		});

		var queue = _.map(self.suites, function (suite) {
			return suite;
		});

		var suite = queue.shift();
		var interval = setInterval(function () {
			if (suite === null || suite === undefined) {
				self.status = DONE;
				self.attempt(function () {
					self.trigger("hiro.onComplete");
				});
				clearInterval(interval);
				return;
			}

			switch(suite.status) {
				case READY:
					suite.prepare(function () {
						suite.run();
					});
					break;
				case DONE:
					if (suite.sandbox)
						suite.sandbox.cleanup();
					suite = queue.shift();
			}
		}, 100);
	}
};
