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
			fn.apply(args);
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
		this.suites[name] = new Suite(name, methods);
	},

	run: function () {
		this.status = RUNNING;

		this.attempt(function () {
			this.trigger("hiro.onStart");
		}, this);

		_.each(this.suites, function (suite) {
			suite.prepare(function () {
				suite.run();
			});
		});

		var interval = setInterval(_.bind(function () {
			var done = _.all(this.suites, function (suite) {
				return suite.status === DONE;
			});

			if (done) {
				this.status = DONE;
				this.attempt(function () {
					this.trigger("hiro.onComplete");
				}, this);
				clearInterval(interval);
			}
		}, this), 100);
	}
};

hiro = new Hiro();

// THESE METHODS SHOULD GO AWAY
Hiro.prototype.autorun = function () {
	hiro.run();
};
