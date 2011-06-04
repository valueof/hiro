(function (window, undefined) {
  var document = window.document;
  var context  = 'web';

  function append(el) {
    qwery('#' + context)[0].appendChild(el);
  }

  function simple(message) {
    var el = document.createElement('p');
    el.className = 'simple';
    el.innerHTML = message;
    append(el);
  }

  hiro.bind('hiro.onStart', function () {
    simple('Starting tests');
  });

  hiro.bind('hiro.onComplete', function () {
    simple('All tests finished');
  });

  hiro.bind('suite.onStart', function (suite) {
    var div  = document.createElement('div');
    var name = document.createElement('h2');
    var uid  = 'hiro_suite_' + suite.name;

    div.className = 'suite idle';
    div.id = uid;
    name.innerHTML = suite.name;
    div.appendChild(name);

    append(div);
    context = uid;
  });

  hiro.bind('suite.onComplete', function (suite, success) {
    var el = qwery('#' + context)[0];

    if (success)
      el.className = el.className.replace('idle', 'succ');
    else
      el.className = el.className.replace('idle', 'fail');

    context = 'web';
  });

  hiro.bind('test.onStart', function (test) {
    var div  = document.createElement('div');
    var uid  = 'hiro_test_' + test.suite.name + '_' + test.name;

    div.className = 'test idle';
    div.id = uid;
    div.innerHTML = test.name;

    append(div);
    context = uid;
  });

  hiro.bind('test.onComplete', function (test, success) {
    var el = qwery('#' + context)[0];

    if (success)
      el.className = el.className.replace('idle', 'succ');
    else
      el.className = el.className.replace('idle', 'fail');

    context = 'hiro_suite_' + test.suite.name;
  });
}(window));

/*
  Logger = function (el) {
    this.container = el;
    this.indented  = false;
  };

  Logger.prototype = {
    write_: function (args, className) {
      var msg  = Array.prototype.join.call(args, ' ');
      var line = document.createElement('p');
      var cons = document.getElementById('console');

      line.innerHTML = msg;

      if (className)
        line.className = className;

      if (this.indented)
        line.className += ' indented';

      cons.appendChild(line);
    },

    title: function () {
      this.write_(arguments, 'title');
    },

    info: function () {
      this.write_(arguments);
    },

    error: function () {
      this.write_(arguments, 'fail');
    },

    success: function () {
      this.write_(arguments, 'succ');
    }
  };*/