/*jshint browser:true, jquery:true, devel:true */
/*global _:false */

var hiro, main;

(function () {
	"use strict";

	hiro = new Hiro();

	main = function () {
		_.each(hiro.suites, function (suite, name) {
			var view = new SuiteView(name, suite);
			view.render();
		});
	};

	function SuiteView(name, model) {
		this.name = name;
		this.template = $("script[type='hiro/template']").html();
		this.tests = [];

		_.each(model.methods, _.bind(function (func, name) {
			if (name.slice(0, 4) !== "test")
				return;

			this.tests.push(name);
		}, this));
	}

	SuiteView.prototype.render = function () {
		var states = [ "ready", "passed", "failed" ];
		var html = _.template(this.template, {
			suiteName: this.name,
			tests: this.tests
		});

		$("#suite-views").append(html);

		var onEnter = function () {
			var $el = $(this);

			if (_.indexOf(states, $el.attr("data-state")) === -1)
				return;

			$el.html("RUN TEST");
		};

		var onLeave = function () {
			var $el = $(this);

			if (_.indexOf(states, $el.attr("data-state")) === -1)
				return;

			$el.html("READY");
		};

		$("#suite-" + this.name + " .status .label").hover(onEnter, onLeave);
	};
})();
