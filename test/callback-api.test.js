var pipsqueak = require('..').callbackApi;
var assert = require('assert');

describe('Callback API', function() {

  var p;
  var executions = 0;
  var task = function(ctx, cb) {
    cb(null, ++executions);
  };

  afterEach(function() {
    executions = 0;
    p.stop();
  });

  it('should pass context to the task', function(done) {
    var contexts = [];
    var task = function(ctx, cb) {
      contexts.push(ctx);
      cb();
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms', }).start();

    setTimeout(function() {
      assert.equal(contexts.length, 3);

      assert.equal(contexts[0].name, 'awesome');
      assert.equal(contexts[0].iteration, 0);
      assert.ok(contexts[0].run);

      assert.equal(contexts[1].name, 'awesome');
      assert.equal(contexts[1].iteration, 1);
      assert.ok(contexts[1].run);

      assert.notEqual(contexts[0].run, contexts[1].run);
      done();
    }, 250);
  });

  it('should run the task at the specified interval', function(done) {
    p = pipsqueak({ task: task, interval: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 3);
      done();
    }, 250);
  });

  it('should start the task after the specified delay', function(done) {
    p = pipsqueak({ task: task, interval: '100ms', delay: '100ms', }).start();
    setTimeout(function() {
      assert.equal(executions, 2);
      done();
    }, 250);
  });

  it('should emit begin and end events', function(done) {
    var events = [];
    var handler = function(event) {
      events.push(event);
    };
    p = pipsqueak({ name: 'awesome', task: task, interval: '100ms', })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(function() {
      assert.equal(events.length, 6);
      assert.equal(events[0].name, 'awesome');
      assert.equal(events[1].name, 'awesome');
      assert.equal(events[0].iteration, 0);
      assert.equal(events[1].iteration, 0);
      assert.equal(events[1].result[0], 1);
      assert.equal(events[0].run, events[1].run);

      assert.equal(events[2].name, 'awesome');
      assert.equal(events[3].name, 'awesome');
      assert.equal(events[2].iteration, 1);
      assert.equal(events[3].iteration, 1);
      assert.equal(events[3].result[0], 2);
      assert.equal(events[2].run, events[3].run);

      assert.notEqual(events[0].run, events[2].run);

      done();
    }, 250);
  });

  it('should emit error events', function(done) {
    var boom = function(ctx, cb) {
      setImmediate(function() {
        cb(new Error('You have idea face!'));
      });
    };
    var events = [];
    var handler = function(event) {
      events.push(event);
    };

    p = pipsqueak({ name: 'awesome', task: boom, interval: '100ms', })
      .on('begin', handler)
      .on('error', handler)
      .on('end', handler)
      .start();

    setTimeout(function() {
      assert.equal(events.length, 9);
      assert.equal(events[0].name, 'awesome');
      assert.equal(events[0].iteration, 0);

      assert.equal(events[0].run, events[1].run);
      assert.equal(events[1].run, events[2].run);

      assert.equal(events[1].error.message, 'You have idea face!');
      done();
    }, 250);
  });

  it('should stop', function(done) {
    p = pipsqueak({ task: task, interval: '100ms', delay: '100ms', }).start();
    p.stop();
    setTimeout(function() {
      assert.equal(executions, 0);
      done();
    }, 250);
  });

});
