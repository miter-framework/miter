/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { wrapPromise } from '../wrap-promise';

describe('util/wrapPromise', () => {
  it('should resolve the promise when the callback function is invoked', async () => {
    let callbackFn = (millis: number, done: Function) => {
      setTimeout(done, millis);
    }
    await wrapPromise(callbackFn, 10);
  });
});
