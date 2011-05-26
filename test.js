hiro.module('GenericTests', {
  setUp: function () {
    this.loadFixture('simple');
  },

  waitFor: function () {
    return this.window.isReady;
  },

  /*
   * Test basic assertions
   */
  testAsserts: function () {
    function Error() {}
    function exc() { throw new Error(); }
    function noexc() { return; }

    this.expect(9);
    this.assertTrue(true);
    this.assertEqual('test', 'test');
    this.assertException(exc, Error);
    this.assertNoException(noexc);

    this.kungFuReversed_(function () {
      this.assertTrue(false);
    });

    this.kungFuReversed_(function () {
      this.assertEqual('test', 'hey');
    });

    this.kungFuReversed_(function () {
      this.assertException(noexc);
    });

    this.kungFuReversed_(function () {
      function WrongError() {}
      this.assertException(exc, WrongError);
    });

    this.kungFuReversed_(function () {
      try { this.assertNoException(exc); } catch (e) {}
    });
  },

  /*
   * Make sure that we can access objects from the inside of sandbox,
   * and that those objects don't have any effect on the outer
   * environment.
   */
  testSandbox: function () {
    var message = 'ping';
    var echo    = this.window.echo;

    this.expect(2);
    this.assertEqual(echo(message), message);
    this.assertTrue(window.echo == null)
  },

  /*
   * Test async execution model (tests can pause the execution by calling
   * the .pause() method; they have to call .resume() method afterwards)
   */
  testAsyncExecution: function () {
    this.expect(1);

    var that = this;
    this.pause();

    setTimeout(function () {
      that.assertTrue(true);
      that.resume();
    }, 500);
  }
});

hiro.module('LoggerTests', {
  setUp: function () { this.loadFixture('hirojs'); },
  waitFor: function () { return this.window.hiro != null; },

  testLogger: function () {
    var doc   = this.document;
    var hiro_ = this.window.hiro;

    function getLines() {
      return doc.getElementsByTagName('P', doc.getElementById('console'));
    }

    this.expect(10)
    this.assertEqual(getLines().length, 1);
    this.assertEqual(getLines()[0].innerHTML, 'Ready.');

    hiro_.logger.info('test', 'message');
    this.assertEqual(getLines().length, 2);
    this.assertEqual(getLines()[1].innerHTML, 'test message');

    hiro_.logger.error('test', 'error');
    this.assertEqual(getLines().length, 3);
    this.assertEqual(getLines()[2].innerHTML, 'test error');
    this.assertEqual(getLines()[2].className, 'fail');

    hiro_.logger.success('test', 'success');
    this.assertEqual(getLines().length, 4);
    this.assertEqual(getLines()[3].innerHTML, 'test success');
    this.assertEqual(getLines()[3].className, 'succ');
  }
});

hiro.module('TestRunnerTests', {
  setUp:   function () { this.loadFixture('hirojs'); },
  waitFor: function () { return this.window.hiro != null; },

  testRun: function () {
    var output = [];
    var hiro_  = this.window.hiro;
    var Test   = hiro_.internals_.Test;
    var Suite  = hiro_.internals_.Suite;
    var test   = new Test('testDummy', testCase, new Suite('test', {}));

    function testCase() {
      this.expect(1);
      this.assertTrue(true);
      this.pause();
    }

    function log() {
      output.push(Array.prototype.join.call(arguments, ' '));
    }

    hiro_.changeTimeout(500);
    hiro_.logger.info = log;
    hiro_.logger.success = log;
    hiro_.logger.error = log;

    this.expect(24);

    this.assertEqual(test.name, 'testDummy');
    this.assertEqual(test.status, 'ready');
    this.assertTrue(!test.failed);
    this.assertTrue(!test.paused);
    this.assertTrue(test.snapshot == null);

    test.run();
    this.assertEqual(test.status, 'running');
    this.assertTrue(test.snapshot != null);
    this.assertTrue(test.paused);

    test.resume();
    this.assertEqual(test.status, 'done');
    this.assertTrue(!test.failed);
    this.assertTrue(!test.paused);

    this.assertTrue(test.report_());
    this.assertEqual(output.length, 2);
    this.assertEqual(output[0], 'Running testDummy');
    this.assertEqual(output[1], 'testDummy succeeded');

    // Test timed out test
    output = [];
    test.status = 'ready';
    test.failed = false;
    test.paused = false;
    test.snapshot = null;

    test.run();
    this.assertEqual(test.status, 'running');
    this.assertTrue(test.snapshot != null);
    this.assertTrue(test.paused);

    this.pause();

    var that = this;
    setTimeout(function () {
      that.assertTrue(test.timedout_());
      test.status = 'done';
      that.assertTrue(test.paused);
      that.assertTrue(!test.report_());

      that.assertEqual(output.length, 2);
      that.assertEqual(output[0], 'Running testDummy');
      that.assertEqual(output[1], 'testDummy timed out');

      that.resume();
    }, 1000);
  },

  testFailedRun: function () {
    var output = [];
    var hiro_  = this.window.hiro;
    var Test   = hiro_.internals_.Test;
    var Suite  = hiro_.internals_.Suite;
    var test   = new Test('testDummy', testCase, new Suite('test', {}));

    function testCase() {
      this.expect(1);
      this.assertTrue(false);
    }

    function log() {
      output.push(Array.prototype.join.call(arguments, ' '));
    }

    hiro_.changeTimeout(500);
    hiro_.logger.info = log;
    hiro_.logger.success = log;
    hiro_.logger.error = log;

    this.expect(13);

    this.assertEqual(test.status, 'ready');
    this.assertTrue(!test.failed);
    this.assertTrue(!test.paused);
    this.assertTrue(test.snapshot == null);

    test.run();
    this.assertEqual(test.status, 'done');
    this.assertTrue(test.snapshot != null);
    this.assertTrue(!test.paused);
    this.assertTrue(test.failed);

    this.assertTrue(!test.report_());
    this.assertEqual(output.length, 3);
    this.assertEqual(output[0], 'Running testDummy');
    this.assertEqual(output[1], 'false is not truthy')
    this.assertEqual(output[2], 'testDummy failed');
  }
});

hiro.module('SuiteTests', {
  setUp:   function () { this.loadFixture('hirojs'); },
  waitFor: function () { return this.window.hiro != null; },

  testRun: function () {
    var output = [];
    var hiro_  = this.window.hiro;
    var Test   = hiro_.internals_.Test;
    var Suite  = hiro_.internals_.Suite;

    function log() {
      output.push(Array.prototype.join.call(arguments, ' '));
    }

    hiro_.changeTimeout(500);
    hiro_.logger.info = log;
    hiro_.logger.success = log;
    hiro_.logger.error = log;

    var suite = new Suite('test', {
      testHello: function () {}
    });

    this.expect(8);

    this.assertEqual(suite.name, 'test');
    this.assertTrue(typeof suite.methods.testHello == 'function');
    this.assertTrue(suite.status == null);

    suite.setUp_();
    this.assertEqual(suite.status, 'ready');

    suite.run();
    this.pause();

    var that = this;
    setTimeout(function () {
      that.assertEqual(suite.status, 'finished');

      suite.tearDown_();
      that.assertTrue(suite.report_());
      that.assertEqual(suite.status, 'done');
      that.assertEqual(output.length, 3);
      that.resume();
    }, 300);
  }
})