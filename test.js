hiro.module('genericTests', {
  // This tests must all pass

  setUp: function () {
      this.loadFixture('demo');
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

    this.expect(4);
    this.assertTrue(true);
    this.assertEqual('test', 'test');
    this.assertException(exc, Error);
    this.assertNoException(noexc);
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