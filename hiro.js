(function (window, undefined) {
  var TEST_TIMEOUT = 5000,
      suites  = {},

      Test,
      Suite,
      Failure;

  function report(test, reason) {
    console.log(test, reason);
  }

  function debug() {
    console.log.apply(console, arguments);
  }

  function isTest(suite, name) {
    return suite.hasOwnProperty(name) && name.slice(0, 4) == 'test';
  }

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

    /**
     * Introspects the current object to get a list of available test cases.
     * Test case is any function that starts with 'test'.
     *
     * @return {array} all available tests
     */
    tests: function () {
      var tests = [];

      for (var name in this) {
        if (isTest(this, name))
          tests.push(new Test(name, this[name], this));
      }

      return tests;
    },

    run: function () {
      var tests = this.tests(),
          that  = this;

      function run() {
        that.running = true;

        var test; // Currently running test case
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
      return this.running;
    }
  };

  Failure = function (message) {
    this.message = message;
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
      if (!value)
        this.fail(value + ' is not true');
    },

    assertEqual: function (expected, actual) {
      if (expected !== actual)
        this.fail(expected + ' != ' + actual);
    },

    fail: function (message) {
      this.passed = false;
      throw new Failure(message);
    },

    run: function () {
      console.log("Running", this.name);

      this.running = true;
      this.passed = true;

      var env = document.createElement('iframe');
      env.id = '__env__' + this.name;
      document.body.appendChild(env);
      env.contentWindow.document.write(this.suite.env);

      try {
        this.func.call(this, env.contentWindow, env.contentWindow.document);
      } catch (exc) {
        if (exc instanceof Failure) {
          console.log('Test ' + this.name + ' failed.');
        }
      }

      document.body.removeChild(env);

      return this.running;
    }
  };

  window.hiro = function (name) {
    suites[name] = new Suite(name);
    return suites[name];
  };

  hiro.run = function () {
    var running = false,
        queue   = [],
        suite;

    for (var name in suites) {
      if (suites.hasOwnProperty(name)) {
        queue.push(suites[name]);
      }
    }

    function run() {
      running = true;

      while (suite = queue.pop()) {
        if (!suite.run()) {
          running = false;
          window.setTimeout(function () {
            run();
          }, TEST_TIMEOUT);
          return;
        }
      }

      debug("Done");
    }

    run();
  };
}(this));
