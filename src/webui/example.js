(function () {
	"use strict";

	hiro.module("BasicTests", {
		testSimpleAssertions: function () {
			this.assertTrue(true);
			this.assertFalse(false);
			this.assertEqual("Hiro Protagonist", "Hiro Protagonist");
		},

		testExceptions: function () {
			this.assertException(function () {
				throw new Error();
			}, Error);
		},

		testAsync: function () {
			var self = this;
			self.pause();

			setTimeout(function () {
				self.assertTrue(true);
				self.resume();
			}, 200);
		}
	});

	hiro.module("NovelTest", {
		setUp: function () {
			this.loadFixture({ name: "example" });
		},

		waitFor: function () {
			return this.sandbox.document.getElementsByTagName("body").length > 0;
		},

		onTest: function () {
			return [ this.sandbox.window, this.sandbox.document ];
		},

		testTitle: function (win, doc) {
			this.assertEqual(doc.getElementsByTagName("h1")[0].innerHTML, "Snow Crash");
		},

		testAuthor: function (win, doc) {
			this.assertEqual(doc.getElementsByTagName("h2")[0].innerHTML, "by Neal Stephenson");
		},

		testFailedTest: function () {
			this.assertTrue(false);
		}
	});
})();
