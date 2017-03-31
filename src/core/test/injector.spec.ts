/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as spies from 'chai-spies';
use(spies);

import { Injector } from '../injector';
import { Logger } from '../../services/logger';
import { Mock } from 'typemoq';

import { Injectable } from '../../decorators/services/injectable.decorator';

describe('Injector', () => {
    let mockLogger = Mock.ofType<Logger>().object;
    let instance: Injector;
    before(() => instance = new Injector(<any>mockLogger));
    
    describe('.resolveInjectable', () => {
        it('should provide the logger when requested', () => {
            expect(instance.resolveInjectable(Logger)).to.equal(mockLogger);
        });
        it('should provide itself when requested', () => {
            expect(instance.resolveInjectable(Injector)).to.equal(instance);
        });
        it('should instantiate a class that has not been created before', () => {
            let ctorCalled = false;
            @Injectable() class TestClass { constructor() { ctorCalled = true; } }
            
            expect(instance.resolveInjectable(TestClass)).to.be.an.instanceOf(TestClass);
            expect(ctorCalled).to.be.true;
        });
        it('should not instantiate a class more than once', () => {
            let ctorCallCount = 0;
            @Injectable() class TestClass { constructor() { ctorCallCount++; } }
            
            let testInst = instance.resolveInjectable(TestClass);
            expect(testInst).to.be.an.instanceOf(TestClass);
            expect(ctorCallCount).to.eq(1);
            expect(instance.resolveInjectable(TestClass)).to.eq(testInst);
            expect(ctorCallCount).to.eq(1);
        });
        it('should return undefined if you try to inject a falsey type', () => {
            expect(instance.resolveInjectable(<any>null)).to.be.undefined;
        });
        it('should inject constructor parameters when it instantiates a type', () => {
            @Injectable() class TestClassInner { constructor() { } }
            @Injectable() class TestClassOuter { constructor(public inner: TestClassInner) { } }
            
            let outer = instance.resolveInjectable(TestClassOuter);
            expect(outer).not.to.be.undefined;
            expect(outer!).to.be.an.instanceOf(TestClassOuter);
            expect(outer!.inner).to.be.an.instanceOf(TestClassInner);
        });
        it('should throw when the constructor parameters cannot be resolved', () => {
            @Injectable() class TestClass { constructor(public dependency: any) { } }
            
            expect(() => instance.resolveInjectable(TestClass)).to.throw(/Failed to resolve constructor types/);
        });
    });
    
    describe('.provide', () => {
        it('should throw when the provide value is falsey', () => {
            expect(() => instance.provide(<any>null)).to.throw(/Invalid ProvideMetadata:/);
        });
        it('should throw when the provide constructor function is falsey', () => {
            expect(() => instance.provide({ provide: <any>null, useValue: null })).to.throw(/provide a value for a falsey type/);
        });
        it('should throw when multiple values for a single type are provided', () => {
            @Injectable() class TestClass { constructor() { } }
            instance.provide({ provide: TestClass, useValue: null });
            expect(() => instance.provide({ provide: TestClass, useValue: null })).to.throw(/Duplicate value provided/);
        });
        it('should dependency inject a replacement class if useClass option present', () => {
            @Injectable() class TestClass { constructor() { } }
            @Injectable() class FauxTestClass { constructor() {} };
            instance.provide({ provide: TestClass, useClass: FauxTestClass });
            expect(instance.resolveInjectable(TestClass)).to.be.an.instanceOf(FauxTestClass);
        });
        it('should dependency inject a replacement value if useValue option present', () => {
            @Injectable() class TestClass { constructor() { } }
            let replacementValue = { myObj: 'someVal' };
            instance.provide({ provide: TestClass, useValue: replacementValue });
            expect(instance.resolveInjectable(TestClass)).to.eq(replacementValue);
        });
        it('should dependency inject a falsey value if useValue option is not undefined', () => {
            @Injectable() class TestClass { constructor() { } }
            instance.provide({ provide: TestClass, useValue: null });
            expect(instance.resolveInjectable(TestClass)).to.be.null;
        });
        it('should dependency inject a factory function if useCallback is present', () => {
            @Injectable() class TestClass { constructor() { } }
            let testInst = new TestClass();
            instance.provide({ provide: TestClass, useCallback: () => testInst });
            expect(instance.resolveInjectable(TestClass)).to.eq(testInst);
        });
        it('should call the factory function every time the class is resolved', () => {
            @Injectable() class TestClass { constructor() { } }
            let callbackCallCount = 0;
            instance.provide({ provide: TestClass, useCallback: () => callbackCallCount++ });
            expect(callbackCallCount).to.eq(0);
            instance.resolveInjectable(TestClass);
            expect(callbackCallCount).to.eq(1);
            instance.resolveInjectable(TestClass);
            expect(callbackCallCount).to.eq(2);
        });
    });
});
