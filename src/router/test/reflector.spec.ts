/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { RouterReflector } from '../reflector';
import { Request, Response } from 'express';

import { Injector } from '../../core/injector';
import { PolicyDescriptor, PolicyT } from '../../core/policy';
import { CtorT } from '../../core/ctor';

import { Injectable } from '../../decorators/services/injectable.decorator';
import { Controller } from '../../decorators/router/controller.decorator';
import { Get } from '../../decorators/router/routes/get.decorator';
import { Policy } from '../../decorators/policies/policy.decorator';

import { RouterMetadata } from '../../metadata/server/router';
import { ControllerMetadata } from '../../metadata/router/controller';
import { RouteMetadata } from '../../metadata/router/route';

import { Logger } from '../../services/logger';
import { RouterService } from '../../services/router.service';
import { FakeRouterService } from '../../services/test/fake-router.service';
import { TransactionService } from '../../services/transaction.service';
import { FakeTransactionService } from '../../services/test/fake-transaction.service';

@Controller()
class EmptyController { }

class ControllerSansDecorator { }

@Controller()
class EmptyControllerChild { }
@Controller({ controllers: [EmptyControllerChild] })
class EmptyControllerRoot { }

@Controller()
class SimpleController {
    @Get('a') async a(req: Request, res: Response) { }
    @Get('b') async b(req: Request, res: Response) { }
    @Get('c') async c(req: Request, res: Response) { }
}
@Controller({
    controllers: [SimpleController]
})
class SimpleControllerRoot { }

@Policy()
class Policy1 {
    async handle(req: Request, res: Response) {
        return "one";
    }
}
@Policy()
class Policy2 {
    async handle(req: Request, res: Response) {
        return "two";
    }
}
@Policy()
class Policy3 {
    async handle(req: Request, res: Response) {
        return "three";
    }
}
@Policy()
class UnusedPolicy {
    async handle(req: Request, res: Response) {
        return "unused";
    }
}

describe('RouterReflector', () => {
    let injector: Injector;
    let routerReflector: RouterReflector;
    beforeEach(() => {
        let logger = new Logger('abc', 'error', false);
        injector = new Injector(logger);
        new RouterMetadata({
            controllers: [
                EmptyController,
                EmptyControllerRoot
            ]
        }, injector);
        injector.provide({ provide: RouterService, useClass: FakeRouterService });
        injector.provide({ provide: TransactionService, useClass: FakeTransactionService });
        routerReflector = injector.resolveInjectable(RouterReflector)!;
    });
    
    describe('.reflectRoutes', () => {
        it('should default to the router metadata controllers if controllers has a falsey value', () => {
            let stub = sinon.stub(routerReflector, 'reflectControllerRoutes');
            routerReflector.reflectRoutes(undefined, []);
            let subject = expect(routerReflector.reflectControllerRoutes).to.have.been;
            subject.calledTwice;
            subject.calledWith([], EmptyController);
            subject.calledWith([], EmptyControllerRoot);
        });
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
        xit('should return an array of route name, metadata tuples', () => {
            
        });
        xit('should include all routes in a controller', () => {
            
        });
        xit('should include multiple routes if multiple route decorators are on a single method', () => {
            
        });
        xit(`should not include methods that don't have a route decorator`, () => {
            
        });
        xit('should include routes from ancestor controllers', () => {
            
        });
    });
    
    describe('.addRoute', () => {
        let fn: (parentMeta: ControllerMetadata[], controller: any, routeFnName: string, controllerMeta: ControllerMetadata, routeMeta: RouteMetadata) => void;
        beforeEach(() => {
            fn = (<any>routerReflector).addRoute.bind(routerReflector);
        });
        xit('should invoke transformPathPart with the route path if it exists on the controller instance', () => {
            
        });
        xit('should invoke transformPath with the full route if it exists on the controller instance', () => {
            
        });
        xit('should invoke transformRoutePolicies with the full list of route policies if it exists on the controller instance', () => {
            
        });
        xit('should invoke resolvePolicies', () => {
            
        });
        xit('should throw an error if the route method is not defined', () => {
            
        });
        xit('should invoke the routing function on the express router with the full path and function', () => {
            
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
            let resultPromise = result[0][1](<any>null, <any>null);
            expect(resultPromise).to.be.an.instanceof(Promise);
            expect(await resultPromise).to.eql('fish!');
        });
        it('should return an array of policy constructor, policy instance tuples', async () => {
            let results = fn([Policy1, Policy2, Policy3]);
            expect(Array.isArray(results)).to.be.true;
            expect(results.length).to.eql(3);
            expect(results[0][0]).to.eql(Policy1);
            expect(await results[0][1](<any>null, <any>null)).to.eql("one");
            expect(results[1][0]).to.eql(Policy2);
            expect(await results[1][1](<any>null, <any>null)).to.eql("two");
            expect(results[2][0]).to.eql(Policy3);
            expect(await results[2][1](<any>null, <any>null)).to.eql("three");
        });
    });
    
    describe('.createFullRouterFn', () => {
        let fn: (policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], boundRoute: any, transactionName: string, meta: RouteMetadata) => (req: Request, res: Response) => Promise<void>;
        let controller = {
            route: async (req: Request, res: Response) => { }
        };
        let stubs: {
            route: sinon.SinonStub
        } = <any>{};
        let boundRoute: (req: Request, res: Response) => Promise<void>;
        beforeEach(() => {
            fn = (<any>routerReflector).createFullRouterFn.bind(routerReflector);
            stubs.route = sinon.stub(controller, 'route').callThrough();
            boundRoute = controller.route.bind(controller);
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
                let result = resultFn(<any>null, <any>null);
                expect(result).to.be.an.instanceOf(Promise);
            });
            xit('should run the route policies and handler with a new transaction', () => {
                
            });
            xit('should call the handle function on each policy', () => {
                
            });
            xit('should stop processing policies if one sets the status code', () => {
                
            });
            xit(`should catch errors thrown in route policies`, () => {
                
            });
            xit(`should send an 'internal server error' status when a policy throws an error`, () => {
                
            });
            xit(`should send a '404 not found' status if the handler does not send a response`, () => {
                
            });
            xit('should catch errors thrown in the route handler', () => {
                
            });
            xit(`should send an 'internal server error' status when the handler throws an error`, () => {
                
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
