var exports = {};

exports.setUp = function (fn) {
	this.container = document.createElement("div");
	containers.appendChild(this.container);
	fn();
};

exports.tearDown = function (fn) {
	containers.removeChild(this.container);

	fn();
};

exports.testSandbox = function (test) {
	var sandbox = new Sandbox({ name: "protagonist" });

	test.strictEqual(sandbox.window, null);
	test.strictEqual(sandbox.document, null);
	test.strictEqual(sandbox.frame, null);
	test.equal(sandbox.name, "protagonist");
	test.equal(sandbox.type, "text");
	test.notEqual(sandbox.data.search(/Neal\sStephenson/), -1);

	sandbox.append(this.container);
	test.notStrictEqual(sandbox.window, null);
	test.notStrictEqual(sandbox.document, null);
	test.notStrictEqual(sandbox.frame, null);
	test.equal(sandbox.frame, document.getElementsByTagName("iframe", this.container)[0]);
	test.equal(sandbox.frame.id, "hiro_fixture_protagonist");
	test.equal(sandbox.frame.style.position, "absolute");
	test.equal(sandbox.frame.style.top, "-2000px");
	test.equal(sandbox.window.author, "Neal Stephenson");

	test.done();
};

exports.testSandboxScript = function (test) {
	var sandbox = new Sandbox({ name: "book" });
	sandbox.append(this.container);
	test.equal(sandbox.frame, document.getElementsByTagName("iframe", this.container)[0]);
	test.equal(sandbox.frame.id, "hiro_fixture_book");

	var html = sandbox.document.getElementsByTagName("body")[0].innerHTML;
	test.equal(html.search(/Snow\sCrash/), 0);

	test.done();
};

// TODO: Test Sandbox with URLs.

window.sandbox = exports;
