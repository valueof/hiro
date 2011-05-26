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
  setUp: function () {
    this.loadFixture('hirojs');
  },

  waitFor: function () {
    return this.window.hiro != null;
  },

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