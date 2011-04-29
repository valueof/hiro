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

      function report(test, result) {
        var exp = test.assertions.expected,
            act = test.assertions.actual;

        if (result && exp > 0 && !(exp == act)) {
          try {
            test.fail('Not all tests were run');
          } catch (exc) {
            console.log(exc.message);
          }

          result = false;
        }

        that.report[test.name] = result;
      }

      function run() {
        that.running = true;

        var test; // Currently running test case
        while (test = tests.pop()) {
          if (test.run()) {
            report(test, test.passed);
          } else {
            that.running = false;
            window.setTimeout(function () {
              report(test, test.running && test.passed);
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

    this.assertions = {
      expected: 0,
      actual:   0
    };

    this.running = false;
    this.passed  = false;
  };

  Test.prototype = {
    assertTrue: function (value) {
      this.assertions.actual++;

      if (!value)
        this.fail(value + ' is not true');
    },

    assertEqual: function (expected, actual) {
      this.assertions.actual++;

      if (expected !== actual)
        this.fail(expected + ' != ' + actual);
    },

    expect: function (num) {
      this.assertions.expected = num;
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