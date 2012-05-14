"use strict";

function Sandbox(opts) {
	this.window   = null;
	this.document = null;
	this.frame    = null;
	this.name     = opts.name;

	if (opts.url) {
		this.type = "url";
		this.data = opts.url;
		return;
	}

	var el;
	var els = _.union(
		_.toArray(document.getElementsByTagName("script")),
		_.toArray(document.getElementsByTagName("textarea"))
	);

	el = _.find(els, function (el) {
		return el.getAttribute("type") === "hiro/fixture" &&
			el.getAttribute("data-name") === opts.name;
	});

	if (el) {
		this.type = "text";
		this.data = el.tagName.toLowerCase() === "script" ? el.innerHTML : el.value;
	}
}

Sandbox.prototype = {
	append: function (container) {
		container = container || document.body;

		var frame = document.createElement("iframe");
		var win, doc;

		frame.id = "hiro_fixture_" + this.name;
		frame.style.position = "absolute";
		frame.style.top = "-2000px";

		if (this.type == "url") {
			frame.src = this.data;
			container.appendChild(frame);
			win = frame.contentWindow;
			doc = win.document;
		} else {
			container.appendChild(frame);
			win = frame.contentWindow;
			doc = win.document;
			doc.write(this.data);
			doc.close();
		}

		this.window   = win;
		this.document = doc;
		this.frame    = frame;
	}
};
