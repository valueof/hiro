module.exports = function (grunt) {
	grunt.initConfig({
		combine: {
			dist: {
				src: [
					"./src/hiro.js",
					"./src/assert.js",
					"./src/sandbox.js",
					"./src/suite.js",
					"./src/test.js"
				],

				dest: "dist/hiro.js"
			}
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


	// Combine files together and make sure that we have only
	// one "use strict"; statement.

	grunt.registerMultiTask('combine', 'Combine files.', function() {
		var files, src, wrappers;

  	files = grunt.file.expandFiles(this.file.src);
    src = grunt.helper('concat', files, { separator: this.data.separator });
		src = src.replace(/"use strict";/gi, "");

		wrappers = grunt.file.expandFiles([ "./src/pre.txt", "./src/post.txt" ]);

    grunt.file.write(this.file.dest, [
			grunt.file.read(wrappers[0]),
			src,
			grunt.file.read(wrappers[1])
		].join("\n"));

    if (this.errorCount)
			return false;

    grunt.log.writeln('File "' + this.file.dest + '" created.');
  });


	grunt.registerTask("default", "lint:beforeconcat combine lint:afterconcat");
};
