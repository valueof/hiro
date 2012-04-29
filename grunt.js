module.exports = function (grunt) {
	grunt.initConfig({
		build: {
			dist: {
				src: [
					"./src/hiro.js",
					"./src/assert.js",
					"./src/sandbox.js",
					"./src/suite.js",
					"./src/test.js"
				],

				dest: "dist"
			}
		},

		watch: {
			all: {
				files: [ "./src/**/*.*" ],
				tasks: "lint build"
			}
		},

		server: {
			port: 7777,
			base: "./dist/"
		},

		lint: {
			beforeconcat: [ "./src/**/*.js", "./test/**/*.js" ],
			afterconcat:  [ "./dist/hiro.js" ]
		},

		jshint: {
			beforeconcat: {
				options: {
					strict:       true,
					globalstrict: true,
					undef:        true,
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
			},

			afterconcat: {
				options: {
					strict:       true,
					globalstrict: true,
					undef:        true,
					smarttabs:    true,
					browser:      true
				},

				globals: {
					_:    false,
					Hiro: false,
					hiro: false
				}
			}
		}
	});


	grunt.registerMultiTask('build', 'Build Hiro.', function() {
		var files, src, wrappers;

		// Combine Hiro files together and make sure that we have only
		// one "use strict"; statement.

  	files = grunt.file.expandFiles(this.file.src);
    src = grunt.helper('concat', files, { separator: this.data.separator });
		src = src.replace(/"use strict";/gi, "");

		wrappers = grunt.file.expandFiles([ "./src/pre.txt", "./src/post.txt" ]);

    grunt.file.write(this.file.dest + "/hiro.js", [
			grunt.file.read(wrappers[0]),
			src,
			grunt.file.read(wrappers[1])
		].join("\n"));

    if (this.errorCount)
			return false;

		// Copy WebUI files.

		[ "icon.jpg", "webui.js", "webui.css", "index.html", "example.js" ].forEach(function (name) {
			grunt.file.copy("./src/webui/" + name, "./dist/" + name);
		});

		// Copy supporting files (underscore, jquery, bootstrap, etc.)

		grunt.file.copy("./lib/underscore.js", "./dist/underscore.js");
		grunt.file.copy("./lib/bootstrap/css/bootstrap.css", "./dist/bootstrap.css");
		grunt.file.copy("./lib/bootstrap/img/glyphicons-halflings.png", "./dist/img/glyphicons-halflings.png");
		grunt.file.copy("./lib/bootstrap/img/glyphicons-halflings-white.png", "./dist/img/glyphicons-halflings-white.png");
		grunt.file.copy("./lib/jquery.js", "./dist/jquery.js");
  });

	grunt.registerTask("default", "lint:beforeconcat build lint:afterconcat");
	grunt.registerTask("run", "server watch");
};
