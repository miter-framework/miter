/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);
import * as chaiAsPromised from 'chai-as-promised';
use(chaiAsPromised);

import { RouterReflector } from '../reflector';
import { Request, Response } from 'express';

import { Injector } from '../../core/injector';
import { PolicyDescriptor, PolicyT } from '../../core/policy';
import { CtorT } from '../../core/ctor';

import { RouterMetadata } from '../../metadata/server/router';
import { ControllerMetadata } from '../../metadata/router/controller';
import { RouteMetadata } from '../../metadata/router/route';

import { LoggerCore } from '../../services/logger-core';
import { ErrorHandler } from '../../services/error-handler';
import { RouterService } from '../../services/router.service';
import { FakeRouterService } from '../../services/test/fake-router.service';
import { TransactionService } from '../../services/transaction.service';
import { FakeTransactionService } from '../../services/test/fake-transaction.service';

import { Policy1, Policy2, Policy3,
         UnusedPolicy,
         EarlyReturnPolicy,
         ThrowPolicy } from './test-policies';
import { EmptyController,
         ControllerSansDecorator,
         EmptyControllerChild, EmptyControllerRoot,
         SimpleController, SimpleChildController, SimpleControllerRoot,
         MultiRouteController,
         PhishingController,
         ComplexController,
         SkipRouteController,
         KeepRouteController,
         AmbivalentController } from './test-controllers';
import { FakeRequest } from './fake-request';
import { FakeResponse } from './fake-response';

describe('RouterReflector', () => {
    let injector: Injector;
    let routerReflector: RouterReflector;
    let errorHandler: ErrorHandler;
    beforeEach(() => {
        let loggerCore = new LoggerCore('abc', 'error', false);
        injector = new Injector(loggerCore);
        let routerMeta = new RouterMetadata({
            controllers: [
                EmptyController,
                EmptyControllerRoot
            ]
        });
        injector.provide({ provide: RouterMetadata, useValue: routerMeta });
        injector.provide({ provide: RouterService, useClass: FakeRouterService });
        injector.provide({ provide: TransactionService, useClass: FakeTransactionService });
        routerReflector = injector.resolveInjectable(RouterReflector)!;
        errorHandler = injector.resolveInjectable(ErrorHandler)!;
    });
    
    describe('.reflectRoutes', () => {
        // it('should default to the router metadata controllers if controllers has a falsey value', () => {
        //     let stub = sinon.stub(routerReflector, 'reflectControllerRoutes');
        //     routerReflector.reflectRoutes(undefined, []);
        //     let subject = expect(routerReflector.reflectControllerRoutes).to.have.been;
        //     subject.calledTwice;
        //     subject.calledWith([], EmptyController);
        //     subject.calledWith([], EmptyControllerRoot);
        // });
        it('should default to an empty array if parentControllers has a falsey value', () => {
            let stub = sinon.stub(routerReflector, 'reflectControllerRoutes');
            routerReflector.reflectRoutes([EmptyController]);
            expect(routerReflector.reflectControllerRoutes).to.have.been.calledWith([], EmptyController);
        });
        it('should invoke reflectControllerRoutes once for each controller', () => {
            let stub = sinon.stub(routerReflector, 'reflectControllerRoutes');
            routerReflector.reflectRoutes([EmptyController, EmptyControllerRoot]);
            expect(routerReflector.reflectControllerRoutes).to.have.been.calledTwice;
        });
    });
    
    describe('.reflectControllerRoutes', () => {
        it('should throw an error if the same controller is reflected twice', () => {
            routerReflector.reflectControllerRoutes([], EmptyController);
            expect(() => routerReflector.reflectControllerRoutes([], EmptyController)).to.throw(/twice/);
        });
        it('should dependency inject the controller', () => {
            let stub = sinon.stub(injector, 'resolveInjectable');
            routerReflector.reflectControllerRoutes([], EmptyController);
            expect(injector.resolveInjectable).to.have.been.calledWith(EmptyController);
        });
        it('should throw an error if a class without the Controller decorator is passed in', () => {
            expect(() => routerReflector.reflectControllerRoutes([], ControllerSansDecorator)).to.throw(/@Controller/);
        });
        it('should throw an error if any of the parent controllers do not have the Controller decorator', () => {
            expect(() => routerReflector.reflectControllerRoutes([ControllerSansDecorator], EmptyController)).to.throw(/failed to reflect parent/i);
        });
        it('should invoke reflectRouteMeta', () => {
            let stub = sinon.stub(routerReflector, 'reflectRouteMeta').callThrough();
            routerReflector.reflectControllerRoutes([], EmptyController);
            expect((<any>routerReflector).reflectRouteMeta).to.have.been.calledWith(EmptyController.prototype);
        });
        it('should invoke addRoute once for each route', () => {
            let inst = injector.resolveInjectable(SimpleController)!;
            let stub = sinon.stub(routerReflector, 'addRoute');
            routerReflector.reflectControllerRoutes([], SimpleController);
            let subject = expect((<any>routerReflector).addRoute).to.have.been;
            subject.calledThrice;
            subject.calledWith([], inst, 'a', {}, { path: 'a', method: 'get' });
            subject.calledWith([], inst, 'b', {}, { path: 'b', method: 'get' });
            subject.calledWith([], inst, 'c', {}, { path: 'c', method: 'get' });
        });
        it(`should recursively invoke reflectRoutes for the controller's children`, () => {
            let stub = sinon.spy(routerReflector, 'reflectRoutes');
            routerReflector.reflectControllerRoutes([], SimpleControllerRoot);
            let subject = expect((<any>routerReflector).reflectRoutes).to.have.been;
            subject.calledTwice;
            subject.calledWith([SimpleController], [SimpleControllerRoot]);
            subject.calledWith([], [SimpleControllerRoot, SimpleController]);
        });
    });
    
    describe('.reflectRouteMeta', () => {
        let fn: (controllerProto: any) => [string, RouteMetadata[]][];
        beforeEach(() => {
            fn = (<any>routerReflector).reflectRouteMeta.bind(routerReflector);
        });
        it('should include all routes in a controller', () => {
            let results = fn(SimpleController.prototype);
            expect(results).to.deep.eq([
                ['a', [{ path: 'a', method: 'get' }]],
                ['b', [{ path: 'b', method: 'get' }]],
                ['c', [{ path: 'c', method: 'get' }]]
            ]);
        });
        it('should include multiple routes if multiple route decorators are on a single method', () => {
            let results = fn(MultiRouteController.prototype);
            expect(results).to.deep.eq([
                ['multi', [
                    { path: 'a', method: 'get' },
                    { path: 'b', method: 'get' },
                    { path: 'x', method: 'post' }
                ]]
            ]);
        });
        it(`should not include methods that don't have a route decorator`, () => {
            let results = fn(PhishingController.prototype);
            expect(results).to.deep.eq([]);
        });
        it('should include routes from ancestor controllers', () => {
            let results = fn(SimpleChildController.prototype);
            expect(results).to.deep.eq([
                ['a', [{ path: 'a', method: 'get' }]],
                ['b', [{ path: 'b', method: 'get' }]],
                ['c', [{ path: 'c', method: 'get' }]],
                ['x', [{ path: 'x', method: 'get' }]],
                ['y', [{ path: 'y', method: 'get' }]],
                ['z', [{ path: 'z', method: 'get' }]]
            ]);
        });
    });
    
    describe('.addRoute', () => {
        let fn: (parentMeta: ControllerMetadata[], controller: any, routeFnName: string, controllerMeta: ControllerMetadata, routeMeta: RouteMetadata) => void;
        beforeEach(() => {
            fn = (<any>routerReflector).addRoute.bind(routerReflector);
        });
        it('should throw an error if the route metadata has no method defined', () => {
            let inst = injector.resolveInjectable(SimpleController)!;
            let test = () => fn([], inst, 'a', {}, <any>{ path: 'x' });
            expect(test).to.throw(/no method set/i);
        });
        it('should invoke transformRoutePathPart with the route path if it exists on the controller instance', () => {
            let inst = injector.resolveInjectable(ComplexController)!;
            sinon.spy(inst, 'transformRoutePathPart');
            routerReflector.reflectControllerRoutes([], ComplexController);
            expect(inst.transformRoutePathPart).to.have.been.calledWith('healthCheck', 'x');
            expect(inst.transformRoutePathPart).to.have.returned('healthCheckxxx');
        });
        it('should invoke transformRoutePath with the full route if it exists on the controller instance', () => {
            let inst = injector.resolveInjectable(ComplexController)!;
            sinon.spy(inst, 'transformRoutePath');
            routerReflector.reflectControllerRoutes([], ComplexController);
            expect(inst.transformRoutePath).to.have.been.calledWith('healthCheck', '/api/healthCheckxxx');
            expect(inst.transformRoutePath).to.have.returned('/API/HEALTHCHECKXXX');
        });
        it('should invoke transformRoutePolicies with the full list of route policies if it exists on the controller instance', () => {
            let inst = injector.resolveInjectable(ComplexController)!;
            sinon.spy(inst, 'transformRoutePolicies');
            routerReflector.reflectControllerRoutes([], ComplexController);
            expect(inst.transformRoutePolicies).to.have.been.calledWith('healthCheck', '/API/HEALTHCHECKXXX', [Policy1, Policy2]);
            expect(inst.transformRoutePolicies).to.have.returned([Policy3, Policy1, Policy2]);
        });
        it('should invoke transformRoute if it exists on the controller instance', () => {
            let inst = injector.resolveInjectable(SkipRouteController)!;
            sinon.spy(inst, 'transformRoute');
            routerReflector.reflectControllerRoutes([], SkipRouteController);
            expect(inst.transformRoute).to.have.been.calledWith({
                routeFnName: 'healthCheck',
                fullPath: '/health-check',
                policyDescriptors: []
            });
        });
        it('should not add a route if transformRoute returns false', () => {
            let inst = injector.resolveInjectable(SkipRouteController)!;
            let router = injector.resolveInjectable(RouterService)!;
            sinon.stub(router.expressRouter, 'get');
            routerReflector.reflectControllerRoutes([], SkipRouteController);
            expect(router.expressRouter.get).not.to.have.been.called;
        });
        it('should add a route if transformRoute returns true', () => {
            let inst = injector.resolveInjectable(KeepRouteController)!;
            let router = injector.resolveInjectable(RouterService)!;
            sinon.stub(router.expressRouter, 'get');
            routerReflector.reflectControllerRoutes([], KeepRouteController);
            expect(router.expressRouter.get).to.have.been.calledOnce;
        });
        it('should add a route if transformRoute returns a falsey value that is not false', () => {
            let inst = injector.resolveInjectable(AmbivalentController)!;
            let router = injector.resolveInjectable(RouterService)!;
            sinon.stub(router.expressRouter, 'get');
            routerReflector.reflectControllerRoutes([], AmbivalentController);
            expect(router.expressRouter.get).to.have.been.calledOnce;
        });
        it('should invoke resolvePolicies', () => {
            sinon.stub(routerReflector, 'resolvePolicies');
            routerReflector.reflectControllerRoutes([], ComplexController);
            expect((<any>routerReflector).resolvePolicies).to.have.been.calledWith([Policy3, Policy1, Policy2]);
        });
        it('should throw an error if the route handler is not defined on the controller', () => {
            let inst = injector.resolveInjectable(EmptyController)!;
            let test = () => fn([], inst, 'doSomething', {}, { method: 'get', path: 'x' });
            expect(test).to.throw(/no route handler/i);
        });
        it('should invoke the routing function on the express router with the full path and function', () => {
            let inst = injector.resolveInjectable(SimpleController)!;
            let router = injector.resolveInjectable(RouterService)!;
            sinon.stub(router.expressRouter, 'get');
            fn([], inst, 'a', {}, <any>{ method: 'get', path: 'x' });
            expect(router.expressRouter.get).to.have.been.calledWith('/x', sinon.match.func);
        });
    });
    
    describe('.getControllerName', () => {
        let fn: (controller: any) => string;
        beforeEach(() => {
            fn = (<any>routerReflector).getControllerName.bind(routerReflector);
        });
        it('should throw an error if passed a falsey value', () => {
            expect(() => fn(<any>null)).to.throw(/falsey controller/);
        });
        it('should extract the controller name from the name of the constructor', () => {
            let empty = new EmptyController();
            expect(fn(empty)).to.eql('EmptyController');
        });
    });
    
    describe('.getParentPolicyDescriptors', () => {
        let fn: (parentMeta: ControllerMetadata[]) => PolicyDescriptor[];
        beforeEach(() => {
            fn = (<any>routerReflector).getParentPolicyDescriptors.bind(routerReflector);
        });
        it('should return an empty array if none of the anscestor controllers have policies', () => {
            let result = fn([
                { policies: [] },
                {              },
                { policies: [] }
            ]);
            expect(result).to.deep.eq([]);
        });
        it('should return an array of all policies in the anscestor controllers', () => {
            let result = fn([
                { policies: <any>['one', 'two'] },
                { policies: <any>['three'] },
                { policies: <any>['four', 'five'] }
            ]);
            expect(result).to.deep.eq(['one', 'two', 'three', 'four', 'five']);
        });
    });
    
    describe('.resolvePolicies', () => {
        let fn: (descriptors: PolicyDescriptor[]) => [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][];
        beforeEach(() => {
            fn = (<any>routerReflector).resolvePolicies.bind(routerReflector);
        });
        it('should return an empty array if there are no policies', () => {
            expect(fn([])).to.be.deep.eq([]);
        });
        it('should dependency inject policies if policy constructors are passed in', () => {
            let stub = sinon.spy(injector, 'resolveInjectable');
            fn([Policy1, Policy2]);
            let subject = expect(injector.resolveInjectable).to.have.been;
            subject.calledTwice;
            subject.calledWith(Policy1);
            subject.calledWith(Policy2)
        });
        it('should support callback-based function policies', async () => {
            let policyFn = (req: Request, res: Response, next: any) => {
                next(null, 'fish!');
            };
            let result = fn([policyFn]);
            expect(result[0][0]).to.be.undefined;
            expect(typeof result[0][1]).to.eql('function');
            let resultPromise = result[0][1](FakeRequest(), FakeResponse());
            expect(resultPromise).to.be.an.instanceof(Promise);
            expect(await resultPromise).to.eql('fish!');
        });
        it('should return an array of policy constructor, policy instance tuples', async () => {
            let results = fn([Policy1, Policy2, Policy3]);
            expect(Array.isArray(results)).to.be.true;
            expect(results.length).to.eql(3);
            expect(results[0][0]).to.eql(Policy1);
            expect(await results[0][1](FakeRequest(), FakeResponse())).to.eql("one");
            expect(results[1][0]).to.eql(Policy2);
            expect(await results[1][1](FakeRequest(), FakeResponse())).to.eql("two");
            expect(results[2][0]).to.eql(Policy3);
            expect(await results[2][1](FakeRequest(), FakeResponse())).to.eql("three");
        });
    });
    
    describe('.createFullRouterFn', () => {
        let fn: (policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], boundRoute: any, transactionName: string, meta: RouteMetadata) => (req: Request, res: Response) => Promise<void>;
        let controller = {
            route: async (req: Request, res: Response) => {
                return await controller.routeImpl(req, res);
            },
            routeImpl: async (req: Request, res: Response) => {
                res.status(200);
            }
        };
        let stubs: {
            route: sinon.SinonSpy
        } = <any>{};
        let boundRoute: (req: Request, res: Response) => Promise<void>;
        beforeEach(() => {
            fn = (<any>routerReflector).createFullRouterFn.bind(routerReflector);
            stubs.route = sinon.spy(controller, 'route');
            boundRoute = controller.route.bind(controller);
            controller.routeImpl = async (req: Request, res: Response) => {
                res.status(200);
            };
        });
        afterEach(() => {
            stubs.route.restore();
        });
        
        it('should return a function', () => {
            let result = fn([], boundRoute, 'tname', { path: 'fish' });
            expect(typeof result).to.eql('function');
        });
        describe('that function', () => {
            it('should return a promise', () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                let result = resultFn(FakeRequest(), FakeResponse());
                expect(result).to.be.an.instanceOf(Promise);
            });
            it('should run the route policies and handler with a new transaction', async () => {
                let policyInst = injector.resolveInjectable(Policy1)!;
                sinon.spy(policyInst, 'handle');
                let resultFn = fn([[Policy1, policyInst.handle.bind(policyInst)]], boundRoute, 'tname', { path: 'fish' });
                let result = await resultFn(FakeRequest(), FakeResponse());
                expect(policyInst.handle).to.have.been.calledOnce;
            });
            it('should call the handle function on each policy', async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                let result = await resultFn(FakeRequest(), FakeResponse());
                expect(controller.route).to.have.been.calledOnce;
            });
            it('should stop processing policies if one sets the status code', async () => {
                let policyInst = injector.resolveInjectable(EarlyReturnPolicy)!;
                sinon.spy(policyInst, 'handle');
                let policy1Inst = injector.resolveInjectable(Policy1)!;
                sinon.spy(policy1Inst, 'handle');
                let resultFn = fn([
                    [EarlyReturnPolicy, policyInst.handle.bind(policyInst)],
                    [Policy1, policy1Inst.handle.bind(policy1Inst)]
                ], boundRoute, 'tname', { path: 'fish' });
                let result = await resultFn(FakeRequest(), FakeResponse());
                expect(policyInst.handle).to.have.been.calledOnce;
                expect(policy1Inst.handle).not.to.have.been.called;
                expect(controller.route).not.to.have.been.called;
            });
            it(`should not catch errors thrown in route policies if the error handler fails`, async () => {
                let policyInst = injector.resolveInjectable(ThrowPolicy)!;
                sinon.spy(policyInst, 'handle');
                let resultFn = fn([[ThrowPolicy, policyInst.handle.bind(policyInst)]], boundRoute, 'tname', { path: 'fish' });
                await expect(resultFn(FakeRequest(), FakeResponse())).to.eventually.be.rejected;
                expect(policyInst.handle).to.have.been.calledOnce;
                expect(controller.route).not.to.have.been.called;
            });
            it(`should catch errors thrown in route policies`, async () => {
                let policyInst = injector.resolveInjectable(ThrowPolicy)!;
                sinon.spy(policyInst, 'handle');
                sinon.stub(errorHandler, 'handleRouteError').returns(Promise.resolve(true));
                let resultFn = fn([[ThrowPolicy, policyInst.handle.bind(policyInst)]], boundRoute, 'tname', { path: 'fish' });
                await expect(resultFn(FakeRequest(), FakeResponse())).not.to.eventually.be.rejected;
                expect(policyInst.handle).to.have.been.calledOnce;
                expect(controller.route).not.to.have.been.called;
            });
            it(`should send an 'internal server error' status when a policy throws an error`, async () => {
                let policyInst = injector.resolveInjectable(ThrowPolicy)!;
                let resultFn = fn([[ThrowPolicy, policyInst.handle.bind(policyInst)]], boundRoute, 'tname', { path: 'fish' });
                let res = FakeResponse();
                sinon.spy(res, 'status');
                sinon.stub(errorHandler, 'handleRouteError').returns(Promise.resolve(true));
                let result = await resultFn(FakeRequest(), res);
                expect(res.status).to.have.been.calledWith(500);
            });
            it(`should send an 'internal server error' status when a policy throws an error even if the error handler fails`, async () => {
                let policyInst = injector.resolveInjectable(ThrowPolicy)!;
                let resultFn = fn([[ThrowPolicy, policyInst.handle.bind(policyInst)]], boundRoute, 'tname', { path: 'fish' });
                let res = FakeResponse();
                sinon.spy(res, 'status');
                let errored = false;
                try { await resultFn(FakeRequest(), res); }
                catch (e) { errored = true; }
                expect(errored).to.be.true;
                expect(res.status).to.have.been.calledWith(500);
            });
            it(`should send a '404 not found' status if the handler does not send a response`, async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                let res = FakeResponse();
                sinon.spy(res, 'status');
                controller.routeImpl = async (req: Request, res: Response) => { };
                let result = await resultFn(FakeRequest(), res);
                expect(res.status).to.have.been.calledWith(404);
            });
            it('should catch errors thrown in the route handler', async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                controller.routeImpl = async (req: Request, res: Response) => {
                    throw new Error(`Going up!`);
                };
                sinon.stub(errorHandler, 'handleRouteError').returns(Promise.resolve(true));
                await expect(resultFn(FakeRequest(), FakeResponse())).not.to.eventually.be.rejected;
            });
            it('should not catch errors thrown in the route handler if the error handler fails', async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                controller.routeImpl = async (req: Request, res: Response) => {
                    throw new Error(`Going up!`);
                };
                await expect(resultFn(FakeRequest(), FakeResponse())).to.eventually.be.rejected;
            });
            it(`should send an 'internal server error' status when the handler throws an error`, async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                let res = FakeResponse();
                sinon.spy(res, 'status');
                controller.routeImpl = async (req: Request, res: Response) => {
                    throw new Error(`Going up!`);
                };
                sinon.stub(errorHandler, 'handleRouteError').returns(Promise.resolve(true));
                let result = await resultFn(FakeRequest(), res);
                expect(res.status).to.have.been.calledWith(500);
            });
            it(`should send an 'internal server error' status when the handler throws an error even if the error handler fails`, async () => {
                let resultFn = fn([], boundRoute, 'tname', { path: 'fish' });
                let res = FakeResponse();
                sinon.spy(res, 'status');
                controller.routeImpl = async (req: Request, res: Response) => {
                    throw new Error(`Going up!`);
                };
                let errored = false;
                try { await resultFn(FakeRequest(), res); }
                catch (e) { errored = true; }
                expect(errored).to.be.true;
                expect(res.status).to.have.been.calledWith(500);
            });
        });
    });
    
    describe('.createPolicyResultsFn', () => {
        let fn: (policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], allResults: any[]) => (policy: number | CtorT<PolicyT<any>>) => any;
        beforeEach(() => {
            fn = (<any>routerReflector).createPolicyResultsFn.bind(routerReflector);
        });
        it('should return a function', () => {
            expect(typeof fn([], [])).to.eql('function');
        });
        describe('that function', () => {
            let resultFn: (policy: number | CtorT<PolicyT<any>>) => any;
            beforeEach(() => {
                resultFn = fn([
                    [Policy1, <any>null],
                    [Policy2, <any>null],
                    [Policy3, <any>null]
                ], ["one", "two", "three"]);
            });
            it('should allow you to index the policies by number', () => {
                expect(resultFn(0)).to.eql('one');
                expect(resultFn(1)).to.eql('two');
                expect(resultFn(2)).to.eql('three');
            });
            it('should return undefined if an index is out of range', () => {
                expect(resultFn(-1)).to.be.undefined;
                expect(resultFn(3)).to.be.undefined;
            });
            it('should return the policy result if the policy constructor is passed in', () => {
                expect(resultFn(Policy1)).to.eql("one");
                expect(resultFn(Policy2)).to.eql("two");
                expect(resultFn(Policy3)).to.eql("three");
            });
            it('should return undefined if an unused policy is passed in', () => {
                expect(resultFn(UnusedPolicy)).to.be.undefined;
            });
        });
    });
});
