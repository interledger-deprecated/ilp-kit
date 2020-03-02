import { assert } from 'chai';
import { makeHandler } from '../src/app';

describe('App', function () {
  it('has a makeHandler method', function () {
    assert.equal(typeof makeHandler, 'function');
  });
});
