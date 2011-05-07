var demo = hiro('events', { fixture: 'demo' });

demo.testEcho = function (window, document) {
    var message = "ping",
        echo    = window.echo;

    this.assertEqual(echo(message), message);
};

demo.testTrue = function (window, document) {
    this.assertTrue(false);
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