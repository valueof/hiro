var exports = {};

exports.testSuccessfulAsserts = function (test) {
	var asserts = new Asserts();

	asserts.assertTrue(true);
	asserts.assertFalse(false);
	asserts.assertEqual("Hiro", "Hiro");
	asserts.assertException(function () { throw new Error(); }, Error);

	test.equal(asserts.executed[0].name, "assertTrue");
	test.strictEqual(asserts.executed[0].expected, asserts.executed[0].actual);

	test.equal(asserts.executed[1].name, "assertFalse");
	test.strictEqual(asserts.executed[1].expected, asserts.executed[1].actual);

	test.equal(asserts.executed[2].name, "assertEqual");
	test.strictEqual(asserts.executed[2].expected, asserts.executed[2].actual);

	test.equal(asserts.executed[3].name, "assertException");
	test.equal(asserts.executed[3].actual.toString(), (new Error()).toString());

	test.done();
};

exports.testFailedAsserts = function (test) {
	var asserts = new Asserts();
	test.expect(4);

	try {
		asserts.assertEqual("Hiro", "Protagonist");
	} catch (exc) {
		test.ok(exc instanceof Failure);
		test.equal(exc.name, "assertEqual");
		test.equal(exc.expected, "Hiro");
		test.equal(exc.actual, "Protagonist");
	} finally {
		test.done();
	}
};

window.asserts = exports;
