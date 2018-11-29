const { assert } = require('chai');
const App = require('../src/app');

describe('App', function () {
  beforeEach(function () {
  });

  afterEach(function () {
  });

  it('has a handler method', function () {
    assert.equal(typeof App.handler, 'function');
  });

  it('has an initApp method', function () {
    assert.equal(typeof App.initApp, 'function');
  });
});
