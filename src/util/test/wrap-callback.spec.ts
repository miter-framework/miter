/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { wrapCallback } from '../wrap-callback';

describe('util/wrapCallback', () => {
    it('should invoke the callback function when the promise is resolved', (done) => {
        let delay = (millis: number) => new Promise((resolve, reject) => {
            setTimeout(resolve, millis);
        });
        let callbackFn = wrapCallback(delay);
        callbackFn(10, done);
    });
});
