/*
 * Copyright (c) 2011 Anton Kovalyov, http://hirojs.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*jshint undef:true, browser:true, strict:true, maxlen:80 */
/*global hiro:false, ender:false */

var web;

(function (window, undefined) {
  "use strict";

  var document = window.document;
  var context  = '#web';

  hiro.bind('hiro.onComplete', function () {
    ender(document.createElement('p'))
      .addClass('simple')
      .html('All tests finished')
      .appendTo(context);
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
    var uid = 'hiro_test_' + test.suite.name + '_' + test.name;
    var div = document.createElement('div');

    ender(div)
      .addClass('test')
      .addClass('idle')
      .attr('id', uid)
      .html(test.name);

    ender(document.createElement('div'))
      .addClass('report')
      .hide()
      .appendTo(div);

    ender(div).appendTo(context);
    context = '#' + uid;
  });

  hiro.bind('test.onFailure', function (test, report) {
    var div = ender('div.report', context);

    ender(document.createElement('p'))
      .html('<label>Assertion:</label> ' + report.assertion)
      .appendTo(div);

    if (report.expected) {
      ender(document.createElement('p'))
        .html('<label>Expected:</label> ' + report.expected)
        .appendTo(div);
    }

    ender(document.createElement('p'))
      .html('<label>Result:</label> ' + report.result)
      .appendTo(div);

    ender(document.createElement('p'))
      .html('<label>Position:</label> ' + report.position)
      .appendTo(div);
  });

  hiro.bind('test.onComplete', function (test, success) {
    ender(context)
      .removeClass('idle')
      .addClass(success ? 'succ' : 'fail');

    if (!success)
      ender('div.report', context).show();

    context = '#hiro_suite_' + test.suite.name;
  });

  hiro.bind('test.onTimeout', function (test, success) {
    ender(context)
      .removeClass('idle')
      .addClass('fail');

    context = '#hiro_suite_' + test.suite.name;
  });

  web = {
    init: function () {
      var list   = ender('div#groups > ul');
      var groups = hiro.getGroups();

      function button(title) {
        var li = ender(document.createElement('li'));
        var bt = ender(document.createElement('button'));

        bt.html(title).appendTo(li);
        li.appendTo(list);
      }

      for (var i = 0, group; group = groups[i]; i++) {
        button(group);
      }

      button("All Suites");
    }
  };
}(window));