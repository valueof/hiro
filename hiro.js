(function (window, undefined) {
  var TIMEOUT = 5000, // Default timeout for test cases and suites
      suites  = {};

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

  /** Checks if a property can be treated as a test case */
  function isTest(obj, name) {
    return obj.hasOwnProperty(name) &&
      name.slice(0, 4) == 'test' && typeof obj[name] == 'function';
  }


  var hiro = function (name) {
    suites[name] = new Suite(name);
    return suites[name];
  };

  extend(hiro, {
    totalTests:  0,
    failedTests: 0,

    addFailure: function (test, message) {
      var div  = document.getElementById('failedTests'),
          list = document.getElementsByTagName('ol', div)[0],
          li   = document.createElement('li'),
          span = document.createElement('span'),
          text = document.createTextNode(message);

      span.innerHTML = test + ': ';
      li.appendChild(span);
      li.appendChild(text);
      list.appendChild(li);
    },

    setStatus: function (status) {
      document.getElementById('report').className = status;
    },

    setMessage: function (message) {
      document.getElementById('status').innerHTML = message;
    },

    run: function () {
      var running = false,
          queue   = [],
          suite;

      // Get all available suites
      each(suites, function (st, name) {
        queue.push(st);
      });

      hiro.setStatus('passed');
      hiro.setMessage('Running tests...');

      // Run them
      function run() {
        running = true;

        while (suite = queue.pop()) {
          running = suite.run();
          if (!running)
            return window.setTimeout(function () {
              run();
            }, TIMEOUT);
        }

        if (hiro.failedTests)
          hiro.setMessage(hiro.failedTests + ' out of ' + hiro.totalTests + ' passed.');
        else
          hiro.setMessage('All ' + hiro.totalTests + ' passed');
      }

      run();
    }
  });


  Suite = function (name) {
    this.name   = name;
    this.report = {};
    this.env    = '';

    this.running = false;
  };

  Suite.prototype = {
    setup: function (fixture) {
      var els = document.getElementsByTagName('textarea');
      for (var i = 0, el; el = els[i]; i++)
        if (el.className == 'fixture' && el.getAttribute('data-name') == fixture) {
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
          that  = this;

      function report(test, result) {
        var exp = test.assertions.expected,
            act = test.assertions.actual;

        if (result && exp > 0 && !(exp == act)) {
          try {
            test.fail('Not all tests were run');
          } catch (exc) {}

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
            }, TIMEOUT);
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
      var el = document.getElementById('report');

      this.passed = false;
      hiro.failedTests++;
      hiro.addFailure(this.suite.name + '.' + this.name, message);

      if (el.className != 'failed')
        el.className = 'failed';

      throw new Failure(message);
    },

    run: function () {
      hiro.setMessage('Running ' + this.suite.name + '.' + this.name);
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
      }

      document.body.removeChild(env);

      return this.running;
    }
  };

  window.hiro = hiro;
}(this));