/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { delay } from '../delay';

describe('util/delay', () => {
    it('should throw an error if the argument is not a number', () => {
        expect(() => (<any>delay)()).to.throw(/not a number/i);
        expect(() => (<any>delay)(null)).to.throw(/not a number/i);
        expect(() => (<any>delay)('string')).to.throw(/not a number/i);
        expect(() => (<any>delay)({ key: 'value' })).to.throw(/not a number/i);
    });
    it('should return a promise', async () => {
        expect(delay(100)).to.be.an.instanceOf(Promise);
    });
    describe('that promise', () => {
        it('should resolve after the specified number of milliseconds', async () => {
            let beginMillis = new Date().valueOf();
            await delay(100);
            let endMillis = new Date().valueOf();
            expect(endMillis - beginMillis).to.be.closeTo(100, 20);
        });
    })
});
