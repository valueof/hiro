var demo = hiro();

demo.loadFixture('demo');
demo.waitFor(function (window, document) {
    return window.isReady;
});

demo.testEcho = function (window, document) {
    var message = "ping",
        echo    = window.echo;

    this.assertEqual(echo(message), message);
};

demo.testTrue = function (window, document) {
    this.assertTrue(true);
};

demo.testAsync = function (window, document) {
    this.expect(2);
    this.assertTrue(true);

    var that = this;
    this.pause();
    setTimeout(function () {
        that.assertTrue(true);
    }, 2000);
};