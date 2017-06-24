/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Injector } from '../injector';
import { Logger } from '../../services/logger';

import { Injectable } from '../../decorators/services/injectable.decorator';

describe('Injector', () => {
    let logger: Logger;
    let instance: Injector;
    beforeEach(() => {
        logger = new Logger('abc-xyz', 'default', false);
        instance = new Injector(logger);
    });
    
    describe('.resolveInjectable', () => {
        it('should provide the logger when requested', () => {
            expect(instance.resolveInjectable(Logger)).to.equal(logger);
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
        it('should invoke resolveDependencies when constructing a new instance', () => {
            @Injectable() class TestClass2 { constructor() { } }
            @Injectable() class TestClass { constructor(tc2: TestClass2) { } }
            sinon.spy(instance, 'resolveDependencies');
            instance.resolveInjectable(TestClass);
            expect((<any>instance).resolveDependencies).to.have.been.calledTwice
                .calledWith([TestClass2], 'TestClass')
                .calledWith([], 'TestClass2');
        });
        it('should throw when the constructor parameters cannot be resolved', () => {
            @Injectable() class TestClass { constructor(public dependency: any) { } }
            
            expect(() => instance.resolveInjectable(TestClass)).to.throw(/Failed to resolve dependencies/);
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
        
        describe('when the provide metadata is a replacement class', () => {
            it('should dependency inject a replacement class', () => {
                @Injectable() class TestClass { constructor() { } }
                @Injectable() class FauxTestClass { constructor() {} };
                instance.provide({ provide: TestClass, useClass: FauxTestClass });
                expect(instance.resolveInjectable(TestClass)).to.be.an.instanceOf(FauxTestClass);
            });
        });
        
        describe('when the provide metadata is a replacement value', () => {
            it('should dependency inject a replacement value', () => {
                @Injectable() class TestClass { constructor() { } }
                let replacementValue = { myObj: 'someVal' };
                instance.provide({ provide: TestClass, useValue: replacementValue });
                expect(instance.resolveInjectable(TestClass)).to.eq(replacementValue);
            });
            it('should dependency inject a falsey value', () => {
                @Injectable() class TestClass { constructor() { } }
                instance.provide({ provide: TestClass, useValue: null });
                expect(instance.resolveInjectable(TestClass)).to.be.null;
            });
        });
        
        describe('when the provide metadata is a factory function', () => {
            it('should dependency inject a factory function', () => {
                @Injectable() class TestClass { constructor() { } }
                let testInst = new TestClass();
                instance.provide({ provide: TestClass, useCallback: () => testInst });
                expect(instance.resolveInjectable(TestClass)).to.eq(testInst);
            });
            it('should call the factory function every time the class is resolved', () => {
                @Injectable() class TestClass { constructor() { } }
                let callbackCallCount = 0;
                instance.provide({ provide: TestClass, useCallback: () => callbackCallCount++ });
                instance.resolveInjectable(TestClass);
                expect(callbackCallCount).to.eq(1);
                instance.resolveInjectable(TestClass);
                expect(callbackCallCount).to.eq(2);
            });
            it('should only call the factory function once if cache = true', () => {
                @Injectable() class TestClass { constructor() { } }
                let callbackCallCount = 0;
                instance.provide({ provide: TestClass, useCallback: () => callbackCallCount++, cache: true });
                instance.resolveInjectable(TestClass);
                expect(callbackCallCount).to.eq(1);
                instance.resolveInjectable(TestClass);
                expect(callbackCallCount).to.eq(1);
            });
            it('should dependency inject callback dependencies into the callback', () => {
                @Injectable() class TestClass { constructor() { } }
                @Injectable() class TestClass2 { constructor() { } }
                let testInst = new TestClass();
                let callbackCallCount = 0;
                instance.provide({ provide: TestClass, useCallback: (num2) => {
                    callbackCallCount++;
                    expect(num2).to.be.an.instanceOf(TestClass2);
                    return testInst;
                }, deps: [TestClass2] });
                expect(instance.resolveInjectable(TestClass)).to.eq(testInst);
            });
            it('should invoke resolveDependencies', () => {
                @Injectable() class TestClass { constructor() { } }
                let meta = {
                    provide: TestClass,
                    useCallback: () => <any>void(0),
                    deps: [TestClass]
                };
                sinon.stub(instance, 'resolveDependencies').returns([]);
                instance.provide(meta);
                instance.resolveInjectable(TestClass);
                expect((<any>instance).resolveDependencies).to.have.been.calledOnce.calledWith(meta.deps, 'TestClass');
            });
        })
    });
    
    describe('.resolveDependencies', () => {
        let resolveDependencies: (types: any[] | undefined, name: string) => any[];
        beforeEach(() => {
            resolveDependencies = (<any>instance).resolveDependencies.bind(instance);
        });
        
        it('should throw when the dependencies cannot be resolved', () => {
            expect(() => resolveDependencies([null], 'name')).to.throw(/Failed to resolve dependencies/);
            expect(() => resolveDependencies([Object], 'name')).to.throw(/Failed to resolve dependencies/);
        });
    });
});
