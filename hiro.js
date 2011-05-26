/*jshint undef:true, browser:true, maxlen: 80, loopfunc:true, strict: true, eqnull: true */

var hiro = (function (window, undefined) {
  "use strict";

  var document     = window.document;
  var setTimeout   = window.setTimeout;
  var clearTimeout = window.clearTimeout;
  var TIMEOUT      = 5000; // Default timeout for test cases and suites
  var suites       = {};

  var Suite;
  var Test;
  var Logger;

  function each(obj, callback) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) callback(obj[key], key);
    }
  }

  function timestamp() {
    var date = new Date();
    var args = [
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    ];
    return Date.UTC.apply(null, args);
  }

  Suite = function (name, methods) {
    this.name     = name;
    this.methods  = methods;
    this.report   = {};
    this.env      = '';
    this.status   = null;
    this.snapshot = null;

    // Refs to the sandboxed environment
    this.frame    = null;
    this.window   = null;
    this.document = null;
  };

  Suite.prototype = {
    setUp_: function () {
      var self = this;

      // If user provided a setUp method, call it (this is their chance
      // to load any fixtures)
      if (self.methods.setUp)
        self.methods.setUp.apply(self);

      // If user loaded a fixture, create a sandboxed environment with an
      // iframe and document.write that fixture into it.
      if (self.env !== '') {
        self.frame = document.createElement('iframe');
        self.frame.id = 'hiro_fixture_' + this.name;
        self.frame.style.position = 'absolute';
        self.frame.style.top = '-2000px';
        document.body.appendChild(self.frame);

        // Save references to the sandboxed environment
        self.window = self.frame.contentWindow;
        self.document = self.window.document;

        // We need to document.close right away or Internet Explorer hangs
        // when injected code tries to load external resources.
        self.document.write(self.env);
        self.document.close();
      }

      if (self.methods.waitFor) {
        self.status = 'waiting';
        self.snapshot = timestamp();

        var interval = setInterval(function () {
          if (self.status != 'waiting')
            return;

          if (self.methods.waitFor.apply(self)) {
            self.snapshot = null;
            self.status = 'ready';
            clearInterval(interval);
          }
        }, 100);

        return;
      }

      self.status = 'ready';
    },

    timedout_: function () {
      if (!this.snapshot)
        return false;

      return (timestamp() - this.snapshot) > TIMEOUT;
    },

    tearDown_: function () {
      if (this.status != 'finished')
        return;

      if (this.frame) {
        this.window = null;
        this.document = null;
        document.body.removeChild(this.frame);
      }

      this.status = 'done';
    },

    report_: function () {
      if (this.timedout_()) {
        hiro.logger.error('Suite', this.name, 'timed out');
        return false;
      }

      for (var name in this.report) {
        if (!this.report[name]) {
          hiro.logger.error('Suite', this.name, 'failed');
          return false;
        }
      }

      hiro.logger.success('Suite', this.name, 'succeeded');
      return true;
    },

    loadFixture: function (name) {
      /*jshint boss: true */
      var els = document.getElementsByTagName('textarea');

      for (var i = 0, el; el = els[i]; i++) {
        if (el.className == 'fixture' && el.getAttribute('data-name') == name)
          this.env = el.value;
      }
    },

    run: function (testName) {
      /*jshint boss:true */

      var self  = this;
      var queue = [];
      var test;

      if (!testName) {
        // Push all available tests to the queue
        each(self.methods, function (method, name) {
          if (typeof method == 'function' && name.slice(0, 4) == 'test')
            queue.push(new Test(name, method, self));
        });
      } else {
        queue = [ new Test(testName, self.methods[testName], self) ];
      }

      test = queue.pop();
      self.status = 'running';
      self.snapshot = timestamp();

      var interval = setInterval(function () {
        if (test == null) {
          self.status = 'finished';
          return clearInterval(interval);
        }

        // Test is ready to be executed
        if (test.status == 'ready')
          test.run();

        // Test may put the suite into the running mode by pausing themselves
        // (usually when they wait for async callbacks)
        if (test.status == 'running' && test.timedout_())
          test.status = 'done';

        // Test is done executing
        if (test.status == 'done') {
          self.report[test.name] = test.report_();
          test = queue.pop();
        }
      }, 100);
    }
  };

  Test = function (name, func, suite) {
    this.name     = name;
    this.func     = func;
    this.suite    = suite;
    this.status   = 'ready';
    this.failed   = false;
    this.paused   = false;
    this.snapshot = null;

    this.window   = this.suite.window;
    this.document = this.suite.document;

    this.asserts_ = {
      expected: 0,
      actual:   0
    };
  };

  Test.prototype = {
    fail_: function (message) {
      hiro.logger.error(message);
      this.failed = true;
    },

    timedout_: function () {
      if (!this.snapshot)
        return false;

      return (timestamp() - this.snapshot) > TIMEOUT;
    },

    report_: function () {
      if (this.timedout_()) {
        hiro.logger.indented = true;
        hiro.logger.error(this.name, 'timed out');
        hiro.logger.indented = false;
        return false;
      }

      if (this.failed) {
        hiro.logger.indented = true;
        hiro.logger.error(this.name, 'failed');
        hiro.logger.indented = false;
        return false;
      }

      var exp = this.asserts_.expected;
      var act = this.asserts_.actual;

      if (exp != act) {
        hiro.logger.indented = true;
        hiro.logger.error(exp, 'were expected but', act, 'were executed');
        hiro.logger.indented = false;
        return false;
      }

      hiro.logger.indented = true;
      hiro.logger.success(this.name, 'succeeded');
      hiro.logger.indented = false;
      return true;
    },

    /*
     * WARNING:
     *   You should _never_ use this method in your own tests.
     *                          — Love, Fu-Tzu
     */
    kungFuReversed_: function (sandbox) {
      var error   = hiro.logger.error;
      hiro.logger.error = function () {};

      try {
        if (!this.failed) {
          sandbox.call(this);

          if (!this.failed)
            hiro.logger.write_(['Reversed test', this.name, 'failed'], 'fail');

          this.failed = !this.failed;
        }
      } catch (exc) {
        // pass
      } finally {
        hiro.logger.error = error;
      }
    },

    expect: function (num) {
      this.asserts_.expected = num;
    },

    run: function () {
      hiro.logger.indented = true;
      hiro.logger.info('Running', this.name);
      hiro.logger.indented = false;

      this.status = 'running';
      this.func.call(this);
      this.snapshot = timestamp();

      if (!this.paused)
        this.status = 'done';
    },

    pause: function () {
      this.paused = true;
    },

    resume: function () {
      this.paused = false;
      if (this.status == 'running')
        this.status = 'done';
    },

    toString: function () {
      return this.suite.name + '.' + this.name;
    }
  };

  var asserts = {
    assertTrue: function (value) {
      if (!value)
        this.fail_(value + ' is not truthy');
    },

    assertEqual: function (expected, actual) {
      if (expected !== actual)
        this.fail_(expected + ' != ' + actual);
    },

    assertNoException: function (func) {
      try {
        func();
      } catch (exc) {
        this.fail_('Exception ' + exc.toString() + ' has been thrown');
      }
    },

    assertException: function (func, expectedException) {
      try {
        func();
        this.fail_('Expected exception');
      } catch (exc) {
        if (!(exc instanceof expectedException))
          this.fail_('Wrong exception has been thrown');
      }
    }
  };

  each(asserts, function (fn, name) {
    Test.prototype[name] = function () {
      this.asserts_.actual++;
      if (this.failed)
        return;
      fn.apply(this, arguments);
    };
  });


  Logger = function (el) {
    this.container = el;
    this.indented  = false;
  };

  Logger.prototype = {
    write_: function (args, className) {
      var msg  = Array.prototype.join.call(args, ' ');
      var line = document.createElement('p');
      var cons = document.getElementById('console');

      line.innerHTML = msg;

      if (className)
        line.className = className;

      if (this.indented)
        line.className += ' indented';

      cons.appendChild(line);
    },

    title: function () {
      this.write_(arguments, 'title');
    },

    info: function () {
      this.write_(arguments);
    },

    error: function () {
      this.write_(arguments, 'fail');
    },

    success: function () {
      this.write_(arguments, 'succ');
    }
  };

  return {
    // We're exposing private objects for unit tests.
    // NOBODY should use them outside of unit tests.
    internals_: {
      Suite:   Suite,
      Test:    Test
    },

    logger: new Logger(),

    changeTimeout: function (timeout) {
        TIMEOUT = timeout;
    },

    module: function (name, methods) {
      suites[name] = new Suite(name, methods);
    },

    run: function (suiteName, testName) {
      /*jshint boss:true */

      var running = false;
      var queue   = [];
      var suite;

      if (!suiteName) {
        // Push all available suites to the queue
        for (var name in suites) {
          queue.push(suites[name]);
        }
      } else {
        queue = [ suites[suiteName] ];
      }

      suite = queue.pop();

      var interval = setInterval(function () {
        if (suite == null)
          return clearInterval(interval);

        // Suite hasn't been started yet. We need to reset necessary properties
        // and call user-defined setUp and waitFor methods (if any)
        if (suite.status === null) {
          hiro.logger.title(suite.name);
          suite.setUp_();
        }


        // If user specified waitFor it may put the suite into the waiting
        // status, meaning that we have to wait until user-provided condition
        // is met or until we hit the TIMEOUT value.
        if (suite.status == 'waiting' && suite.timedout_())
          suite.status = 'finished';

        // Suite is ready to be executed.
        if (suite.status == 'ready') {
          if (suiteName && testName)
            suite.run(testName);
          else
            suite.run();
        }

        // Tests may put the suite into the running mode by pausing themselves
        // (usually when they wait for asyncronous callbacks).
        if (suite.status == 'running' && suite.timedout_())
          suite.status = 'finished';

        // Suite is done executing (including async tests), we can do cleanup
        // and report the results.
        if (suite.status == 'finished') {
          suite.tearDown_();
          suite.report_();
        }

        // If suite is not done yet, don't proceed with the loop
        if (suite.status == 'done')
          suite = queue.pop();
      }, 100);
    }
  };
}(this));