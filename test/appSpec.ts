const { assert } = require('chai');
const App = require('../src/app');

describe('App', function () {
  beforeEach(function () {
  });

  afterEach(function () {
  });

  it('has a makeHandler method', function () {
    assert.equal(typeof App.makeHandler, 'function');
  });
});
