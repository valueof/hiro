Hiro
====

Hiro is a framework for testing third-party JavaScript applications.
It runs each test suite in a separate sandbox preventing global state
leaks and conflicts.

Stable version can be found here: http://hirojs.com/. The current
*master* branch contains the source of Hiro 2, backwards incompatible
iteration of Hiro that is scheduled to be released soon.

Patches
-------

Before submitting a patch please make sure that:

  0) You have an issue opened describing your problem or proposal.
  1) You use tabs for indentation.
  2) Your coding style looks similar to what is already in the repo.
  3) All JavaScript files pass JSHint check (you can run 'grunt lint'
     to automatically lint files.
  4) All tests pass. To run tests open 'tests/test.html' in your
     browser.
  5) Example tests behave as intended. To check that execute 'grunt run'
     and open http://localhost:7777/ in your browser. Execute all tests
     and you should see only three failures:

       * BasicTests.testFailedTest
       * Basictests.testFailedExpect
       * FailedSuite.testSimple

     These failures were introduced for UI demonstration purposes.
  6) Your commit messages look good (no one-liners please). See most
     recent commit messages for reference.

Author
------

Anton Kovalyov
http://anton.kovalyov.net
@valueof
