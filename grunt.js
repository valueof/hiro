module.exports = function (grunt) {
	grunt.initConfig({
		lint: {
			all: [ "./src/**/*.js", "./test/**/*.js" ]
		},

		jshint: {
			options: {
				strict:       true,
				globalstrict: true,
				smarttabs:    true,
				browser:      true
			},

			globals: {
				_:          false,
				containers: false,
				hiro:       true,
				Hiro:       true,
				Asserts:    true,
				Test:       true,
				Suite:      true,
				Sandbox:    true,
				READY:      true,
				DONE:       true,
				PAUSED:     true,
				WAITING:    true,
				RUNNING:    true
			}
		}
	});
};
