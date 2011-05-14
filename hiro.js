/*jshint undef:true, browser:true, maxlen: 80, loopfunc:true, strict: true */

(function (window, undefined) {
  "use strict";

  var document     = window.document;
  var setTimeout   = window.setTimeout;
  var clearTimeout = window.clearTimeout;
  var TIMEOUT      = 5000; // Default timeout for test cases and suites
  var suites       = {};

  var Suite;
  var Test;
  var Failure;
  var hiro;

  function each(obj, callback) {
    /*jshint expr: true */
    for (var key in obj)
      obj.hasOwnProperty(key) && callback(obj[key], key);
  }

  function extend(dest, source) {
    each(source, function (val, key) { dest[key] = val; });
    return dest;
  }

  function isTest(obj, name) {
    return obj.hasOwnProperty(name) &&
      name.slice(0, 4) == 'test' && typeof obj[name] == 'function';
  }

  function log(text, callback) {
    /*jshint expr: true */
    var line = document.createElement('p'),
        cons = document.getElementById('console');

    line.innerHTML = text;
    callback && callback(line);
    cons.appendChild(line);
  }

  function waitFor(condition, onSuccess, onFailure) {
    /*jshint expr: true */
    var elapsed = 0;

    function wait() {
      elapsed += 100;
      if (condition())
        onSuccess();
      else if (elapsed < TIMEOUT)
        setTimeout(wait, 100);
      else
        onFailure();
    }

    condition() ? onSuccess() : wait();
  }

  function createFrame(id) {
    var frame = document.createElement('iframe');

    frame.id = id;
    frame.style.position = 'absolute';
    frame.style.top = '-2000px';
    document.body.appendChild(frame);
    return frame;
  }

  hiro = function (name) {
    suites[name] = new Suite(name);
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

    this.running = false;
    this.events_ = {};
    this.onResume = function () {};
  };

  Suite.prototype = {
    waitFor: function (condition) {
      this.condition_ = condition;
    },

    loadFixture: function (name) {
      /*jshint boss: true */
      var els = document.getElementsByTagName('textarea');

      for (var i = 0, el; el = els[i]; i++) {
        if (el.className == 'fixture' && el.getAttribute('data-name') == name)
          this.env = el.value;
      }
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
          that  = this,
          env;

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
          test.env = env;
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

        document.body.removeChild(env);
      }

      env = createFrame('__env__' + this.name);
      env.contentWindow.document.write(this.env);
      env.contentWindow.document.close();

      function condition() {
        return that.condition_(env.contentWindow, env.contentWindow.document);
      }

      if (this.condition_) {
        this.running = false;
        waitFor(condition, run, function () {
          hiro.logFailure('Condition for suite', that.name, 'timed out');
        });
      } else {
        run();
      }

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

    assertNoException: function (func) {
      this.assertions.actual++;

      try {
        func();
        if (!this.running)
          this.resume();
      } catch (exc) {
        this.fail('Exception ' + exc.toString() + ' has been thrown');
      }
    },

    assertException: function (func, expectedException) {
      this.assertions.actual++;

      try {
        func();
        this.fail('Expected exception');
      } catch (exc) {
        if (!(exc instanceof expectedException))
          this.fail('Wrong exception has been thrown');
        else if (!this.running)
          this.resume();
      }
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

      var win = this.env.contentWindow;

      try {
        this.func.call(this, win, win.document);
      } catch (exc) {
        if (!(exc instanceof Failure))
          throw exc;
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