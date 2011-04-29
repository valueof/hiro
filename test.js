var demo = hiro('events');

var html = "<html><head><script>function echo(message) { return message; }</script></head><body><p>echo</p></body></html>";
demo.setup(html);

demo.testEcho = function (window, document) {
    var message = "ping",
        echo    = window.echo;

    this.assertEqual(echo(message), message);
};

demo.testTrue = function (window, document) {
    this.assertTrue(false);
};

demo.testAsync = function (window, document) {
    this.running = false;

    var that = this;
    setTimeout(function () {
        that.assertTrue(true);
        that.running = true;
    }, 2000);
};