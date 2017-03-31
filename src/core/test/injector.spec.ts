/// <reference types="mocha" />

import { expect } from 'chai';

import { Injector } from '../injector';
import { Logger } from '../../services/logger';
import { Mock } from 'typemoq';

describe('Injector', () => {
    let mockLogger = Mock.ofType<Logger>().object;
    let instance: Injector;
    before(() => instance = new Injector(<any>mockLogger));
    
    describe('.resolveInjectable', () => {
        it('provides the logger when requested', () => {
            expect(instance.resolveInjectable(Logger)).to.equal(mockLogger);
        });
        it('provides itself when requested', () => {
            expect(instance.resolveInjectable(Injector)).to.equal(instance);
        });
        it('should pass this spec', () => {
            expect(true).to.equal(true);
        });
    });
});
