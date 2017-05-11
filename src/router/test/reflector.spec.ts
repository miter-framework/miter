/// <reference types="mocha" />

import { expect, use } from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
use(sinonChai);

import { RouterReflector } from '../reflector';

import { Injector } from '../../core/injector';
import { PolicyDescriptor, PolicyT } from '../../core/policy';
import { CtorT } from '../../core/ctor';

import { Injectable } from '../../decorators/services/injectable.decorator';
import { Controller } from '../../decorators/router/controller.decorator';

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

@Controller()
class EmptyControllerChild { }
@Controller({ controllers: [EmptyControllerChild] })
class EmptyControllerRoot { }

describe('RouterReflector', () => {
    let injector: Injector;
    let routerReflector: RouterReflector;
    beforeEach(() => {
        let logger = new Logger('abc', 'error', false);
        injector = new Injector(logger);
        new RouterMetadata({ }, injector);
        injector.provide({ provide: RouterService, useClass: FakeRouterService });
        injector.provide({ provide: TransactionService, useClass: FakeTransactionService });
        routerReflector = injector.resolveInjectable(RouterReflector)!;
    });
    
    describe('.reflectRoutes', () => {
        xit('should default to the router metadata controllers if controllers has a falsey value', () => {
            
        });
        xit('should default to an empty array if parentControllers has a falsey value', () => {
            
        });
        xit('should invoke reflectControllerRoutes once for each controller', () => {
            
        });
    });
    
    describe('.reflectControllerRoutes', () => {
        xit('should throw an error if the same controller is reflected twice', () => {
            
        });
        xit('should dependency inject the controller', () => {
            
        });
        xit('should throw an error if a class without the Controller decorator is passed in', () => {
            
        });
        xit('should throw an error if any of the parent controllers do not have the Controller decorator', () => {
            
        });
        xit('should invoke reflectRouteMeta', () => {
            
        });
        xit('should invoke addRoute once for each route', () => {
            
        });
        xit(`should recursively invoke reflectRoutes for the controller's children`, () => {
            
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
            fn = (<any>routerReflector).getParentPolicyDescriptors.bind(routerReflector);
        });
        xit('should return an empty array if there are no policies', () => {
            
        });
        xit('should dependency inject policies if policy constructors are passed in', () => {
            
        });
        xit('should support callback-based function policies', () => {
            
        });
        xit('should return an array of policy constructor, policy instance tuples', () => {
            
        });
    });
    
    describe('.createFullRouterFn', () => {
        xit('should return a function', () => {
            
        });
        describe('(result)', () => {
            xit('should return a promise', () => {
                
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
        xit('should return a function', () => {
            
        });
        describe('(result)', () => {
            xit('should allow you to index the policies by number', () => {
                
            });
            xit('should return the policy result if the policy constructor is passed in', () => {
                
            });
            xit('should return undefined if an unused policy is passed in', () => {
                
            });
        });
    });
});
