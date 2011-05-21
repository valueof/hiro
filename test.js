hiro.module('demo', {
    setUp: function () {
        this.loadFixture('demo');
    },

    waitFor: function () {
        return this.window.isReady;
    },

    testEcho: function () {
        var message = 'ping';
        var echo    = this.window.echo;
        this.assertEqual(echo(message), message);
    },

    testTrue: function () {
        this.assertTrue(true);
    },

    testAsync: function () {
        this.expect(1);

        var that = this;
        this.pause();
        setTimeout(function () {
            that.assertTrue(true);
        }, 500);
    }
});