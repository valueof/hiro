(function (window, undefined) {
  var TEST_TIMEOUT = 5000,
      suites  = {},

      Test,
      Suite;

  Suite = function (name) {
    this.name   = name;
    this.report = {};
    this.env    = '';

    this.running = false;
  };

  Suite.prototype = {
    setup: function (env) {
      this.env = env;
    },

    tests: function () {
      var tests = [];

      for (var name in this)
        if (this.hasOwnProperty(name) && name.slice(0, 4) == 'test')
          tests.push(new Test(name, this[name], this));

      return tests;
    },

    run: function () {
      var tests = this.tests(),
          that  = this;

      function run() {
        that.running = true;

        var test;
        while (test = tests.pop()) {
          if (test.run()) {
            that.report[test.name] = test.passed;
          } else {
            that.running = false;
            window.setTimeout(function () {
              that.report[test.name] = test.running && test.passed;
              run();
            }, TEST_TIMEOUT);
            return;
          }
        }
      }

      run();
    }
  };

  Test = function (name, func, suite) {
    this.name  = name;
    this.func  = func;
    this.suite = suite;

    this.running = false;
    this.passed  = false;
  };

  Test.prototype = {
    assertTrue: function (value) {
      if (!value) this.fail();
    },

    assertEqual: function (expected, actual) {
      if (expected !== actual) this.fail();
    },

    fail: function () {
      this.passed = false;
    },

    run: function () {
      console.log("Running", this.name);

      this.running = true;
      this.passed = true;

      var env = document.createElement('iframe');
      env.id = '__env__' + this.name;
      document.body.appendChild(env);
      env.contentWindow.document.write(this.suite.env);

      this.func.call(this, env.contentWindow, env.contentWindow.document);

      document.body.removeChild(env);

      return this.running;
    }
  };

  window.hiro = function (name) {
    suites[name] = new Suite(name);
    return suites[name];
  };

  hiro.run = function () {
    for (var name in suites) {
      if (suites.hasOwnProperty(name)) {
        suites[name].run();
      }
    }
  };
}(this));
