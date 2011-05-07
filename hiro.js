/*jshint undef:true, browser:true, maxlen: 80, loopfunc:true, strict: true */

(function (window, undefined) {
  "use strict";

  var document     = window.document,
      setTimeout   = window.setTimeout,
      clearTimeout = window.clearTimeout,
      TIMEOUT      = 5000, // Default timeout for test cases and suites
      suites       = {},
      Suite,
      Test,
      Failure;

  function each(obj, callback) {
    for (var key in obj)
      if (obj.hasOwnProperty(key))
        callback(obj[key], key);
  }

  /** Merges contents of `source` into `dest` and returns the result */
  function extend(dest, source) {
    each(source, function (val, key) {
      dest[key] = val;
    });
    return dest;
  }

  /** Checks if property can be treated as a test case */
  function isTest(obj, name) {
    return obj.hasOwnProperty(name) &&
      name.slice(0, 4) == 'test' && typeof obj[name] == 'function';
  }

  /** Checks if DOMElement can be treated as a fixture */
  function isFixture(el, name) {
    return el.className == 'fixture' && el.getAttribute('data-name') == name;
  }

  /** Adds text to the output element */
  function log(text, callback) {
    /*jshint expr: true */
    var line = document.createElement('p'),
        cons = document.getElementById('console');

    line.innerHTML = text;
    callback && callback(line);
    cons.appendChild(line);
  }

  var hiro = function (name, options) {
    options = options || {};
    suites[name] = new Suite(name);
    if (options.fixture)
      suites[name].setup(options.fixture);
    return suites[name];
  };

  extend(hiro, {
    totalTests:  0,
    failedTests: 0,

    setStatus: function (status) {
      document.getElementById('report').className = status;
    },

    log: function () {
      log(Array.prototype.join.call(arguments, ' '));
    },

    logFailure: function () {
      log(Array.prototype.join.call(arguments, ' '), function (el) {
        el.className = 'fail';
      });
    },

    logSuccess: function () {
      log(Array.prototype.join.call(arguments, ' '), function (el) {
        el.className = 'succ';
      });
    },

    run: function () {
      var running = false,
          queue   = [];

      // Get all available suites
      each(suites, function (st, name) {
        queue.push(st);
      });

      hiro.log('Running tests...');

      // Run them
      function run() {
        /*jshint boss:true */
        running = true;

        var suite,
            timeout,
            func;

        while (suite = queue.pop()) {
          running = suite.run();

          if (!running) {
            func = function () {
              clearTimeout(timeout);
              run();
            };

            suite.onResume = func;
            timeout = setTimeout(func, TIMEOUT);
            return;
          }
        }

        var failed = hiro.failedTests,
            total  = hiro.totalTests;

        if (hiro.failedTests) {
          hiro.logFailure(failed, 'out of', total, 'failed.');
        } else {
          hiro.logSuccess('All', total, 'passed');
          hiro.setStatus('passed');
        }
      }

      run();
    }
  });

  Suite = function (name) {
    this.name   = name;
    this.report = {};
    this.env    = '';

    this.running  = false;
    this.onResume = function () {};
  };

  Suite.prototype = {
    setup: function (fixtureName) {
      /*jshint boss:true */

      var els = document.getElementsByTagName('textarea');
      for (var i = 0, el; el = els[i]; i++)
        if (isFixture(el, fixtureName))
          this.env = el.value;
    },

    /**
     * Introspects the current object to get a list of available test cases.
     * Test case is any function that starts with 'test'.
     *
     * @return {array} all available tests
     */
    tests: function () {
      var tests = [],
          that  = this;

      each(this, function (prop, name) {
        if (isTest(that, name))
          tests.push(new Test(name, that[name], that));
      });

      return tests;
    },

    run: function () {
      var tests = this.tests(),
          that  = this;

      function report(test) {
        var exp = test.assertions.expected,
            act = test.assertions.actual,
            result = false;

        if (!test.running)
          test.fail('Timed out', true);
        else if (exp > 0 && exp != act)
          test.fail('Not all assertions were executed', true);
        else
          result = true;

        that.report[test.name] = result;
      }

      function run() {
        /*jshint boss:true */
        that.running = true;

        var test,    // Currently running test case
            timeout, // A timeout for asynchronous tests
            func;    // A function to call when test either calls resume()
                     // or times out.

        while (test = tests.pop()) {
          if (!test.run()) {
            that.running = false;

            func = function () {
              clearTimeout(timeout);
              report(test);
              run();
            };

            test.onResume = func;
            timeout = setTimeout(func, TIMEOUT);
            return;
          }

          report(test, test.passed);
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

    this.onResume = function () {};
  };

  Test.prototype = {
    assertTrue: function (value) {
      this.assertions.actual++;

      if (!value)
        this.fail(value + ' is not true');
      else if (!this.running)
        this.resume();
    },

    assertEqual: function (expected, actual) {
      this.assertions.actual++;

      if (expected !== actual)
        this.fail(expected + ' != ' + actual);
      else if (!this.running)
        this.resume();
    },

    expect: function (num) {
      this.assertions.expected = num;
    },

    fail: function (message, noexc) {
      var el = document.getElementById('report');

      this.passed = false;
      hiro.failedTests++;
      hiro.setStatus('failed');
      hiro.logFailure('Test', this.toString(), 'failed:', message);

      if (el.className != 'failed')
        el.className = 'failed';

      if (!this.running)
        this.resume();

      if (!noexc)
        throw new Failure(message);
    },

    run: function () {
      hiro.log('Running', this.toString());
      hiro.totalTests++;
      this.running = true;
      this.passed = true;

      var env = document.createElement('iframe');
      env.id = '__env__' + this.name;
      document.body.appendChild(env);
      env.contentWindow.document.write(this.suite.env);

      try {
        this.func.call(this, env.contentWindow, env.contentWindow.document);
      } catch (exc) {
        if (!(exc instanceof Failure))
          throw exc;
      } finally {
        document.body.removeChild(env);
      }

      return this.running;
    },

    pause: function () {
      this.running = false;
    },

    resume: function () {
      this.running = true;
      this.onResume();
      this.suite.onResume();
    },

    toString: function () {
      return this.suite.name + '.' + this.name;
    }
  };

  window.hiro = hiro;
}(this));