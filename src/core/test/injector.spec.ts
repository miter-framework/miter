/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { Injector } from '../injector';
import { LoggerCore } from '../../services/logger-core';
import { CtorT } from '../../core/ctor';
import { Injectable } from '../../decorators/services/injectable.decorator';
import { Service } from '../../decorators/services/service.decorator';
import { InjectableMetadata } from '../../metadata/services/injectable';
import { Meta } from '../../decorators/services/meta.decorator';
import { Name } from '../../decorators/services/name.decorator';

type InjectableDecoratorT = <T>(meta?: InjectableMetadata<T>) => ((ij: CtorT<T>) => void);

let allDecorators: [InjectableDecoratorT, string][] = [
  [Injectable, 'injectable'],
  [Service, 'service']
];

describe('Injector', () => {
  let loggerCore: LoggerCore;
  let instance: Injector;
  beforeEach(() => {
    loggerCore = new LoggerCore('abc-xyz', 'default', false);
    instance = new Injector(loggerCore);
  });

  describe('.resolveInjectable', () => {
    it('should provide the logger core when requested', () => {
      expect(instance.resolveInjectable(LoggerCore)).to.equal(loggerCore);
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
    it('should throw an error if you try to inject a falsey type', () => {
      expect(() => instance.resolveInjectable(<any>null)).to.throw('falsey');
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
        .calledWith([TestClass2], TestClass)
        .calledWith([], TestClass2);
    });
    it('should throw an error when the constructor parameters cannot be resolved', () => {
      @Injectable() class TestClass { constructor(public dependency: any) { } }

      expect(() => instance.resolveInjectable(TestClass)).to.throw(/Failed to resolve dependencies/);
    });
    it('should throw an error when a constructor introduces a circular dependency', () => {
      @Injectable() class TestClass { constructor() { } }
      @Injectable() class TestClass2 { constructor() { } }
      Reflect.defineMetadata('design:paramtypes', [TestClass2], TestClass);
      Reflect.defineMetadata('design:paramtypes', [TestClass], TestClass2);
      expect(() => instance.resolveInjectable(TestClass)).to.throw(/circular dependency/i);
    });

    allDecorators.forEach(([decoratorFn, decoratorName]) => {
      describe(`when the ${decoratorName} decorator defines a provide value`, () => {
        describe('when the provide value attempts to use a replacement class', () => {
          it('should throw an exception', () => {
            class OtherTestClass { constructor() { } };
            @decoratorFn({
              provide: <any>{
                useClass: OtherTestClass
              }
            }) class TestClass { constructor() { } };

            expect(() => instance.resolveInjectable(TestClass)).to.throw(/specify a callback function/i);
          });
        });

        describe('when the provide value attepts to use a replacement value', () => {
          it('should throw an exception', () => {
            @decoratorFn({
              provide: <any>{
                useValue: null
              }
            }) class TestClass { constructor() { } };

            expect(() => instance.resolveInjectable(TestClass)).to.throw(/specify a callback function/i);
          });
        });

        describe('when the provide value attempts to use a factory function', () => {
          it('should invoke the factory function to provide the value', () => {
            let inst = Symbol();
            @decoratorFn({
              provide: {
                useCallback: () => <any>inst
              }
            }) class TestClass { constructor() { } };
            let result = instance.resolveInjectable(TestClass);
            expect(result).to.eq(inst);
          });
          it('should invoke the factory function each time the class is resolved', () => {
            let invokeCount = 0;
            @decoratorFn({
              provide: {
                useCallback: () => <any>invokeCount++
              }
            }) class TestClass { constructor() { } };
            instance.resolveInjectable(TestClass);
            instance.resolveInjectable(TestClass);
            expect(invokeCount).to.eq(2);
          });
          it('should invoke the factory function only once if cache = true', () => {
            let invokeCount = 0;
            @decoratorFn({
              provide: {
                useCallback: () => <any>invokeCount++,
                cache: true
              }
            }) class TestClass { constructor() { } };
            instance.resolveInjectable(TestClass);
            instance.resolveInjectable(TestClass);
            expect(invokeCount).to.eq(1);
          });
          it('should not invoke the factory function before the class is resolved even if cache = true', () => {
            let invokeCount = 0;
            @decoratorFn({
              provide: {
                useCallback: () => <any>invokeCount++,
                cache: true
              }
            }) class TestClass { constructor() { } };
            expect(invokeCount).to.eq(0);
            instance.resolveInjectable(TestClass);
            expect(invokeCount).to.eq(1);
          });
        });
      });
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
        @Injectable() class FauxTestClass { constructor() {} }
        instance.provide({ provide: TestClass, useClass: FauxTestClass });
        expect(instance.resolveInjectable(TestClass)).to.be.an.instanceOf(FauxTestClass);
      });
      it('should not construct the replacement class more than once', () => {
        @Injectable() class TestClass { constructor() { } }
        var instanceCount = 0;
        @Injectable() class FauxTestClass { constructor() { instanceCount++; } };
        instance.provide({ provide: TestClass, useClass: FauxTestClass });
        instance.resolveInjectable(TestClass);
        instance.resolveInjectable(TestClass);
        expect(instanceCount).to.eq(1);
      });
      it('should not instantiate a provided class if resolveInjectable is never called', () => {
        let ctorCallCount = 0;
        @Injectable() class TestClass { constructor() { ctorCallCount++; } }

        instance.provide({ provide: TestClass, useClass: TestClass });
        expect(ctorCallCount).to.eq(0);
      });
      it('should resolve to the same instance as if you resolved the replacement class directly', () => {
        @Injectable() class TestClass { constructor() { } }
        var instanceCount = 0;
        @Injectable() class FauxTestClass { constructor() { instanceCount++; } };
        instance.provide({ provide: TestClass, useClass: FauxTestClass });
        let inst1 = instance.resolveInjectable(TestClass);
        let inst2 = instance.resolveInjectable(FauxTestClass);
        expect(instanceCount).to.eq(1);
        expect(inst1).to.eq(inst2);
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
      it('should not call factory function before the class is resolved even if cache = true', () => {
        @Injectable() class TestClass { constructor() { } }
        let callbackCallCount = 0;
        instance.provide({ provide: TestClass, useCallback: () => callbackCallCount++, cache: true });
        expect(callbackCallCount).to.eq(0);
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
          deps: []
        };
        sinon.stub(instance, 'resolveDependencies').returns([]);
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect((<any>instance).resolveDependencies).to.have.been.calledOnce.calledWith(meta.deps, TestClass);
      });
      it('should resolve string dependencies to defined metadata', () => {
        let testAbc = 'my?test:abc!';
        @Injectable()
        class TestClass2 { constructor() { } }
        @Injectable()
        @Meta('abc', testAbc)
        class TestClass { constructor(private tc2: TestClass2) { } }
        let resolvedAbc = '';
        let meta = {
          provide: TestClass2,
          useCallback: (abc: string) => resolvedAbc = abc,
          deps: ['abc']
        };
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect(resolvedAbc).to.eq(testAbc);
      });
      it('should not resolve string dependencies for metadata on the factory function class', () => {
        let testAbc = 'my?test:abc!';
        @Injectable()
        @Meta('abc', testAbc)
        class TestClass { constructor() { } }
        let resolvedAbc = '';
        let meta = {
          provide: TestClass,
          useCallback: (abc: string) => resolvedAbc = abc,
          deps: ['abc']
        };
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect(resolvedAbc).to.be.undefined;
      });
      it('should resolve string dependencies for metadata on the factory function class', () => {
        let testAbc = 'my?test:abc!';
        @Injectable()
        @Meta('name', testAbc)
        class TestClass { constructor() { } }
        let resolvedAbc = '';
        let meta = {
          provide: TestClass,
          useCallback: (abc: string) => resolvedAbc = abc,
          deps: ['abc']
        };
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect(resolvedAbc).to.be.undefined;
      });
      it(`should resolve the 'name' dependency even if the name has been explicitly defined`, () => {
        @Injectable()
        class TestClass2 { constructor() { } }
        @Injectable()
        class TestClass { constructor(private tc2: TestClass2) { } }
        let resolvedName = '';
        let meta = {
          provide: TestClass2,
          useCallback: (name: string) => resolvedName = name,
          deps: ['name']
        };
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect(resolvedName).to.eq(TestClass.name);
      });
      it(`should allow a custom 'name' metadata to be explicitly defined`, () => {
        let testName = 'my!!!!test:name##';
        @Injectable()
        class TestClass2 { constructor() { } }
        @Injectable()
        @Name(testName)
        class TestClass { constructor(private tc2: TestClass2) { } }
        let resolvedName = '';
        let meta = {
          provide: TestClass2,
          useCallback: (name: string) => resolvedName = name,
          deps: ['name']
        };
        instance.provide(meta);
        instance.resolveInjectable(TestClass);
        expect(resolvedName).to.eq(testName);
      });
      it('should resolve string dependencies for metadata on the factory function class when resolving other dependencies', () => {
        let testName = 'my?test:name!';
        let resolvedName = '';
        @Injectable()
        class TestClass3 { constructor() { } }
        @Injectable()
        @Meta('name', testName + '2')
        class TestClass2 { constructor(private tc3: TestClass3) { } }
        @Injectable()
        @Meta('name', testName)
        class TestClass { constructor(private tc2: TestClass2) { } }
        let meta3 = {
          provide: TestClass3,
          useCallback: (name: string) => resolvedName = name,
          deps: ['name']
        };
        instance.provide(meta3);
        let meta2 = {
          provide: TestClass2,
          useCallback: (tc3: TestClass3) => <any>void(0),
          deps: [TestClass3]
        };
        instance.provide(meta2);
        instance.resolveInjectable(TestClass);
        expect(resolvedName).to.eq(testName + '2');
      });
      it('should throw an error when the factory function depends on itself', () => {
        @Injectable() class TestClass { constructor() { } }
        let meta = {
          provide: TestClass,
          useCallback: () => <any>void(0),
          deps: [TestClass]
        };
        instance.provide(meta);
        expect(() => instance.resolveInjectable(TestClass)).to.throw(/circular dependency/i);
      });
      it('should throw an error when a factory function introduces a circular dependency', () => {
        @Injectable() class TestClass { constructor() { } }
        @Injectable() class TestClass2 { constructor(private tc: TestClass) { } }
        let meta = {
          provide: TestClass,
          useCallback: (tc2: TestClass2) => <any>void(0),
          deps: [TestClass2]
        };
        instance.provide(meta);
        expect(() => instance.resolveInjectable(TestClass)).to.throw(/circular dependency/i);
      });
      it('should not call the factory function if resolveInjectable is never called', () => {
        @Injectable() class TestClass { constructor() { } }
        let callbackCallCount = 0;
        let meta = {
          provide: TestClass,
          useCallback: () => {
            callbackCallCount++;
            return new TestClass();
          },
        };
        instance.provide(meta);
        expect(callbackCallCount).to.eq(0);
      });
      it('should not call the factory function if resolveInjectable is never called, even if cached = true', () => {
        @Injectable() class TestClass { constructor() { } }
        let callbackCallCount = 0;
        let meta = {
          provide: TestClass,
          useCallback: () => {
            callbackCallCount++;
            return new TestClass();
          },
          cache: true
        };
        instance.provide(meta);
        expect(callbackCallCount).to.eq(0);
      });
    });

    allDecorators.forEach(([decoratorFn, decoratorName]) => {
      describe(`when the ${decoratorName} decorator also defines a provide value`, () => {
        it('should override the decorator provide value', () => {
          let callbackInvokeCount = 0, ctorInvokeCount = 0;
          @decoratorFn({
            provide: <any>{
              useCallback: () => callbackInvokeCount++
            }
          }) class TestClass { constructor() { } };
          @decoratorFn() class SuperTestClass extends TestClass { constructor() { super(); ctorInvokeCount++; } }
          instance.provide({ provide: TestClass, useClass: SuperTestClass });
          let result = instance.resolveInjectable(TestClass)!;
          expect(result).to.be.an.instanceOf(SuperTestClass);
          expect(callbackInvokeCount).to.eq(0);
          expect(ctorInvokeCount).to.eq(1);
        });
        it('should not invoke or construct anything before the class is resolved', () => {
          let callbackInvokeCount = 0, ctorInvokeCount = 0;
          @decoratorFn({
            provide: <any>{
              useCallback: () => callbackInvokeCount++
            }
          }) class TestClass { constructor() { } };
          @decoratorFn() class SuperTestClass extends TestClass { constructor() { super(); ctorInvokeCount++; } }
          instance.provide({ provide: TestClass, useClass: SuperTestClass });
          expect(callbackInvokeCount).to.eq(0);
          expect(ctorInvokeCount).to.eq(0);
        });
      });
    });
  });

  describe('.resolveDependencies', () => {
    let resolveDependencies: (types: any[] | undefined, ctor: CtorT<any>) => any[];
    beforeEach(() => {
      resolveDependencies = (<any>instance).resolveDependencies.bind(instance);
    });

    it('should throw when the dependencies cannot be resolved', () => {
      @Injectable() class TestClass { constructor() { } }
      expect(() => resolveDependencies([null], TestClass)).to.throw(/Failed to resolve dependencies/);
      expect(() => resolveDependencies([Object], TestClass)).to.throw(/Failed to resolve dependencies/);
    });
  });
});
