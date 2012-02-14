lint:
	@echo "hiro.js"
	@jshint hiro.js --config jshint.json && echo "* OK"
	@echo

	@echo "web.js"
	@jshint web.js --config jshint.json && echo "* OK"
	@echo

	@echo "test.js"
	@jshint test.js --config jshint.json && echo "* OK"
	@echo


serve:
	@python -m SimpleHTTPServer 7777
