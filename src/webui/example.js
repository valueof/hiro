(function () {
	"use strict";

	hiro.module("BasicTests", {
		testSimpleAssertions: function () {
			this.expect(3);

			this.assertTrue(true);
			this.assertFalse(false);
			this.assertEqual("Hiro Protagonist", "Hiro Protagonist");
		},

		testExceptions: function () {
			this.expect(1);

			this.assertException(function () {
				throw new Error();
			}, Error);
		},

		testAsync: function () {
			this.expect(1);
			this.pause();

			setTimeout(function () {
				this.assertTrue(true);
				this.resume();
			}, 200);
		}
	});

	hiro.module("NovelTest", {
		setUp: function () {
			this.loadFixture({ name: "example" });
		},

		waitFor: function () {
			return this.document.getElementsByTagName("body").length > 0;
		},

		onTest: function () {
			return [ this.window, this.document ];
		},

		testTitle: function (win, doc) {
			this.assertEqual(doc.getElementsByTagName("h1")[0].innerHTML, "Snow Crash");
		},

		testAuthor: function (win, doc) {
			this.assertEqual(doc.getElementsByTagName("h2")[0].innerHTML, "by Neal Stephenson");
		}
	});
})();
