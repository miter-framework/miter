import 'reflect-metadata';
import { Request, Response } from 'express';

import { Injector } from '../core/injector';
import { PolicyDescriptor } from '../core/policy';
import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';

import { Injectable } from '../decorators/services/injectable.decorator';

import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../metadata/router/controller';
import { RouteMetadata, RouteMetadataSym } from '../metadata/router/route';
import { RouterMetadata } from '../metadata/server/router';

import { Logger } from '../services/logger';
import { TransactionService } from '../services/transaction.service';
import { RouterService } from '../services/router.service';

import { inhertitanceHierarchy } from '../util/inheritance-hierarchy';
import { joinRoutePaths } from '../util/join-route-paths';
import { wrapPromise } from '../util/wrap-promise';
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../util/http-status-type';

import './extend-req-res';

@Injectable()
export class RouterReflector {
    constructor(
        private injector: Injector,
        private logger: Logger,
        private routerMeta: RouterMetadata,
        private _router: RouterService,
        private transactionService: TransactionService
    ) { }
    
    get router() {
        return this._router;
    }
    
    reflectRoutes(controllers?: any[], parentControllers?: any[]) {
        parentControllers = parentControllers || [];
        controllers = controllers || this.routerMeta.controllers;
        
        this.logger.verbose('router', `in reflectRoutes; controllers=[${controllers && controllers.map(c => c.name || c)}]; parentControllers=[${parentControllers && parentControllers.map(c => c.name || c)}]`)
        for (let q = 0; q < controllers.length; q++) {
            this.reflectControllerRoutes(parentControllers, controllers[q]);
        }
    }
    
    private controllers: any = {};
    reflectControllerRoutes(parentControllers: any[], controllerFn: any) {
        if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn.name || controllerFn}.`);
        let controllerInst = this.controllers[controllerFn] = this.injector.resolveInjectable(controllerFn);
        let controllerProto = controllerFn.prototype;
        
        let meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controllerProto);
        if (!meta) throw new Error(`Expecting class with @Controller decorator, could not reflect routes for ${controllerFn.name || controllerFn}.`);
        this.logger.info('router', `Reflecting routes for controller ${controllerFn.name || controllerFn}`);
        
        parentControllers = parentControllers || [];
        let parentMeta: ControllerMetadata[] = parentControllers.map(pc => Reflect.getOwnMetadata(ControllerMetadataSym, pc.prototype));
        if (parentMeta.some(pm => !pm)) throw new Error(`Failed to reflect parent controller metadata for controller: ${controllerFn.name || controllerFn}`);
        
        let routes = this.reflectRouteMeta(controllerProto);
        for (let q = 0; q < routes.length; q++) {
            let [routeFnName, routeMetaArr] = routes[q];
            for (let w = 0; w < routeMetaArr.length; w++) {
                let routeMeta = routeMetaArr[w];
                this.addRoute(parentMeta, controllerInst, routeFnName, meta, routeMeta);
            }
        }
        
        this.reflectRoutes(meta.controllers || [], [...parentControllers, controllerFn]);
    }
    
    private reflectRouteMeta(controllerProto: any): [string, RouteMetadata[]][] {
        let hierarchy = inhertitanceHierarchy(controllerProto);
        this.logger.verbose('router', 'reflecting routes for inheritance hierarchy:', hierarchy.map(fn => fn.name || fn));
        let routeMeta: [string, RouteMetadata[]][] = [];
        for (let r = 0; r < hierarchy.length; r++) {
            let fn = hierarchy[r];
            let routeNames: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, fn) || [];
            for (let q = 0; q < routeNames.length; q++) {
                let routeFnName: string = routeNames[q];
                let routeMetaArr: RouteMetadata[] = Reflect.getOwnMetadata(RouteMetadataSym, fn, routeFnName) || [];
                routeMeta.push([routeFnName, routeMetaArr]);
                //TODO: Ensure routes on parent classes are still accessible
            }
        }
        return routeMeta;
    }
    
    private addRoute(parentMeta: ControllerMetadata[], controller: any, routeFnName: string, controllerMeta: ControllerMetadata, routeMeta: RouteMetadata) {
        let controllerName = this.getControllerName(controller);
        let transactionName = `${controllerName}#${routeFnName}`;
        
        let pathPart = routeMeta.path;
        if (typeof controller.transformPathPart === 'function') {
            pathPart = controller.transformPathPart(routeFnName, pathPart) || pathPart;
        }
        let fullPath = joinRoutePaths(...[
            this.routerMeta.path,
            ...parentMeta.map(pm => pm.path || ''),
            controllerMeta.path || '',
            pathPart
        ]);
        if (controller.transformPath) {
            fullPath = controller.transformPath(routeFnName, fullPath) || fullPath;
        }
        
        let policyDescriptors = [
            ...(this.routerMeta.policies),
            ...this.getParentPolicyDescriptors(parentMeta),
            ...(controllerMeta.policies || []),
            ...(routeMeta.policies || [])
        ];
        if (typeof controller.transformRoutePolicies === 'function') {
            policyDescriptors = controller.transformRoutePolicies(routeFnName, fullPath, policyDescriptors) || policyDescriptors;
        }
        let policies = this.resolvePolicies(policyDescriptors);
        let boundRoute = controller[routeFnName].bind(controller);
        
        if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create route ${controller}.${routeFnName}. No method set!`);
        this.logger.verbose('router', `& Adding route ${routeFnName} (${routeMeta.method.toUpperCase()} ${fullPath})`);
        
        let addRouteFn = (<any>this.router.expressRouter)[routeMeta.method].bind(this.router.expressRouter);
        let fullRouterFn = this.createFullRouterFn(policies, boundRoute, transactionName);
        addRouteFn(fullPath, fullRouterFn);
    }
    private getControllerName(controller: any): string {
        if (!controller) {
            throw new Error(`Cannot extract name from falsey controller: ${controller}`);
        }
        else if (controller.constructor && controller.constructor.name) {
            return controller.constructor.name;
        }
        else if (controller.name) {
            return controller.name;
        }
        else return controller;
    }
    private getParentPolicyDescriptors(parentMeta: ControllerMetadata[]): PolicyDescriptor[] {
        let policies = [];
        for (let pm of parentMeta)
        {
            policies.push(...(pm.policies || []));
        }
        return policies;
    }
    private resolvePolicies(descriptors: PolicyDescriptor[]): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][] {
        return descriptors.map((desc): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }] => {
            let key: undefined | CtorT<PolicyT<any>>;
            let fn: { (req: Request, res: Response): Promise<any> };
            if (this.isPolicyCtor(desc)) {
                key = desc;
                let val = this.injector.resolveInjectable(desc);
                if (!val) throw new Error(`Could not resolve dependency for policy: ${desc.name || desc}`);
                desc = val;
            }
            if (this.isPolicyT(desc)) {
                fn = desc.handle.bind(desc);
            }
            else {
                let handler = desc;
                fn = async function(req: Request, res: Response) {
                    return await wrapPromise(handler, req, res);
                }
            }
            return [key, fn];
        });
    }
    private isPolicyCtor(desc: PolicyDescriptor): desc is CtorT<PolicyT<any>> {
        if (this.isPolicyT(desc)) return false;
        let ctorFn = <CtorT<PolicyT<any>>>desc;
        return !!(ctorFn.prototype && ctorFn.prototype.handle);
    }
    private isPolicyT(desc: PolicyDescriptor): desc is PolicyT<any> {
        return !!(<PolicyT<any>>desc).handle;
    }
    
    unfinishedRoutes = 0;
    requestIndex = 0;
    private createFullRouterFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], boundRoute: any, transactionName: string) {
        let fullRouterFn = async function(this: RouterReflector, requestIndex: number, req: Request, res: Response) {
            this.logger.info('router', `{${requestIndex}} beginning request: ${req.url}`);
            this.logger.verbose('router', `{${requestIndex}} unfinishedRoutes: ${++this.unfinishedRoutes}`);
            let allResults: any[] = [];
            req.policyResults = this.createPolicyResultsFn(policies, allResults);
            let initialStatusCode = res.statusCode;
            for (let q = 0; q < policies.length; q++) {
                let policy = policies[q];
                let result: any;
                let policyCtor = policy[0];
                let policyName = (policyCtor && (policyCtor.name || policyCtor)) || '(undefined)';
                try {
                    this.logger.verbose('router', `{${requestIndex}} awaiting policy ${q+1}/${policies.length} (${policyName})`);
                    result = await policy[1](req, res);
                    this.logger.verbose('router', `{${requestIndex}} policy ${policyName} returned with result ${JSON.stringify(result)}`);
                }
                catch (e) {
                    this.logger.error('router', `{${requestIndex}} policy (${policyName}) threw an exception. Serving 500 - Internal server error`);
                    this.logger.error('router', e);
                    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
                    res.send('Internal server error');
                    this.logger.verbose('router', `{${requestIndex}} ending request. unfinishedRoutes: ${--this.unfinishedRoutes}`);
                    return;
                }
                allResults.push(result);
                if (res.statusCode !== initialStatusCode || res.headersSent) return;
            }
            
            this.logger.verbose('router', `{${requestIndex}} policies complete`);
            let failed = false;
            try {
                this.logger.verbose('router', `{${requestIndex}} calling route`);
                await boundRoute(req, res);
                this.logger.verbose('router', `{${requestIndex}} route complete`);
            }
            catch (e) {
                this.logger.error('router', `{${requestIndex}} route threw an exception. Serving 500 - Internal server error. unfinishedRoutes: ${--this.unfinishedRoutes}`);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
                res.send('Internal server error');
                failed = true;
                throw e; //This ensures that the transaction is rolled back
            }
            finally {
                if (!failed && res.statusCode === initialStatusCode && !res.headersSent) {
                    this.logger.error('router', `{${requestIndex}} route failed to send a response. Serving 404 - Not Found`);
                    res.status(HTTP_STATUS_NOT_FOUND);
                    res.send(`Not found.`);
                    this.logger.verbose('router', `{${requestIndex}} ending request. unfinishedRoutes: ${--this.unfinishedRoutes}`);
                }
            }
        };
        
        let self = this;
        return async function(req: Request, res: Response) {
            let requestIndex = ++self.requestIndex;
            try {
                await self.transactionService.run(`{${requestIndex}}:${transactionName}`, async () => {
                    await fullRouterFn.call(self, requestIndex, req, res);
                });
            }
            catch (e) {
                self.logger.error('router', e);
            }
        }
    }
    private createPolicyResultsFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], allResults: any[]) {
        let keys = policies.map(poli => poli[0]);
        return function(policyFn: CtorT<PolicyT<any>> | number) {
            if (typeof policyFn === 'number') return allResults[policyFn];
            for (let q = 0; q < keys.length; q++) {
                if (keys[q] === policyFn) return allResults[q];
            }
            return undefined;
        }
    }
}
