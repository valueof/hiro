lint:
	@echo "hiro.js"
	@jshint hiro.js --config jshint.json && echo "* OK"
	@echo

	@echo "web.js"
	@jshint env/web/web.js --config jshint.json && echo "* OK"
	@echo

	@echo "phantom.js"
	@jshint env/phantom/phantom.js --config jshint.json && echo "* OK"
	@echo

	@echo "phantom/cli.js"
	@jshint env/phantom/cli.js --config jshint.json && echo "* OK"
	@echo

	@echo "test.js"
	@jshint test.js --config jshint.json && echo "* OK"
	@echo


serve:
	@python -m SimpleHTTPServer 7777


test:
	@phantomjs env/phantom/cli.js
