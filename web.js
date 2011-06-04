/*jshint undef:true, browser:true, strict:true, maxlen:80 */
/*global hiro:false, ender:false */

(function (window, undefined) {
  "use strict";

  var document = window.document;
  var context  = '#web';

  function simple(message) {
    ender(document.createElement('p'))
      .addClass('simple')
      .html(message)
      .appendTo(context);
  }

  hiro.bind('hiro.onStart', function () {
    simple('Starting tests');
  });

  hiro.bind('hiro.onComplete', function () {
    simple('All tests finished');
  });

  hiro.bind('suite.onStart', function (suite) {
    var uid = 'hiro_suite_' + suite.name;
    var div = document.createElement('div');

    ender(div)
      .addClass('suite')
      .addClass('idle')
      .attr('id', uid);

    ender(document.createElement('h2'))
      .html(suite.name)
      .appendTo(div);

    ender(context).append(div);

    context = '#' + uid;
  });

  hiro.bind('suite.onComplete', function (suite, success) {
    ender(context)
      .removeClass('idle')
      .addClass(success ? 'succ' : 'fail');

    context = '#web';
  });

  hiro.bind('suite.onTimeout', function (suite, success) {
    ender(context)
      .removeClass('idle')
      .addClass('fail');

    context = '#web';
  });

  hiro.bind('test.onStart', function (test) {
    var uid  = 'hiro_test_' + test.suite.name + '_' + test.name;

    ender(document.createElement('div'))
      .addClass('test')
      .addClass('idle')
      .attr('id', uid)
      .html(test.name)
      .appendTo(ender(context));

    context = '#' + uid;
  });

  hiro.bind('test.onFailure', function (test, assertion) {
    // pass
  });

  hiro.bind('test.onComplete', function (test, success) {
    ender(context)
      .removeClass('idle')
      .addClass(success ? 'succ' : 'fail');

    context = '#hiro_suite_' + test.suite.name;
  });

  hiro.bind('test.onTimeout', function (test, success) {
    ender(context)
      .removeClass('idle')
      .addClass('fail');

    context = '#hiro_suite_' + test.suite.name;
  });
}(window));