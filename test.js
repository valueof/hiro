var demo = hiro('events');
demo.setup('demo');

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
    this.running = false;
    this.assertTrue(true);

    var that = this;
    setTimeout(function () {
        that.assertTrue(true);
        that.running = true;
    }, 2000);
};