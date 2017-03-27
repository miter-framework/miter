import 'reflect-metadata';
import { Request, Response, Router as ExpressRouter } from 'express';

import { Injector } from '../core/injector';
import { PolicyDescriptor } from '../core/policy';
import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';

import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../metadata/router/controller';
import { RouteMetadata, RouteMetadataSym } from '../metadata/router/route';

import { Server } from '../server/server';

import { Logger } from '../services/logger';

import { inhertitanceHierarchy } from '../util/inheritance-hierarchy';
import { hasNoUndefined } from '../util/has-no-undefined';
import { joinRoutePaths } from '../util/join-route-paths';
import { wrapPromise } from '../util/wrap-promise';
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../util/http-status-type';

import './extend-request';

export class RouterReflector {
    constructor(private server: Server, private router: ExpressRouter) {
    }
    
    get logger() {
        return this.server.logger;
    }
    
    reflectRoutes(controllers: any[]) {
        for (let q = 0; q < controllers.length; q++) {
            this.reflectControllerRoutes(controllers[q]);
        }
    }
    
    private controllers: any = {};
    reflectControllerRoutes(controllerFn: any) {
        if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
        let controllerInst = this.controllers[controllerFn] = this.server.injector.resolveInjectable(controllerFn);
        let controllerProto = controllerFn.prototype;
        
        let meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controllerProto);
        if (!meta) throw new Error(`Expecting class with @Controller decorator, could not reflect routes for ${controllerProto}.`);
        this.logger.info('router', `Reflecting routes for controller ${controllerFn.name}`);
        
        let routes = this.reflectRouteMeta(controllerProto);
        for (let q = 0; q < routes.length; q++) {
            let [routeFnName, routeMetaArr] = routes[q];
            for (let w = 0; w < routeMetaArr.length; w++) {
                let routeMeta = routeMetaArr[w];
                this.addRoute(controllerInst, routeFnName, meta, routeMeta);
            }
        }
    }
    
    private reflectRouteMeta(controllerProto: any): [string, RouteMetadata[]][] {
        let hierarchy = inhertitanceHierarchy(controllerProto);
        let routeMeta: [string, RouteMetadata[]][] = [];
        for (let r = 0; r < hierarchy.length; r++) {
            let fn = hierarchy[r].prototype;
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
    
    private addRoute(controller: any, routeFnName: string, controllerMeta: ControllerMetadata, routeMeta: RouteMetadata) {
        let policyDescriptors = [
            ...(this.server.meta.policies || []),
            ...(controllerMeta.policies || []),
            ...(routeMeta.policies || [])
        ];
        let policies = this.resolvePolicies(policyDescriptors);
        let boundRoute = controller[routeFnName].bind(controller);
        
        let pathPart = routeMeta.path;
        if (controller.transformPathPart) pathPart = controller.transformPathPart(pathPart) || pathPart;
        let fullPath = joinRoutePaths(...[
            this.server.meta.path || '',
            controllerMeta.path || '',
            pathPart
        ]);
        if (controller.transformPath) fullPath = controller.transformPath(fullPath) || fullPath;
        
        if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create route ${controller}.${routeFnName}. No method set!`);
        this.logger.verbose('router', `& Adding route ${routeFnName} (${routeMeta.method.toUpperCase()} ${fullPath})`);
        
        (<any>this.router)[routeMeta.method](fullPath, this.createFullRouterFn(policies, boundRoute, routeMeta));
    }
    private resolvePolicies(descriptors: PolicyDescriptor[]): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][] {
        return descriptors.map((desc): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }] => {
            let key: undefined | CtorT<PolicyT<any>>;
            let fn: { (req: Request, res: Response): Promise<any> };
            if (this.isPolicyCtor(desc)) {
                key = desc;
                let val = this.server.injector.resolveInjectable(desc);
                if (!val) throw new Error(`Could not resolve dependency for policy: ${desc}`);
                desc = val;
            }
            if (this.isPolicyT(desc)) {
                fn = desc.handle.bind(desc);
            }
            else {
                let handler = desc;
                fn = async function(req: Request, res: Response) {
                    await wrapPromise(handler, req, res);
                }
            }
            return [key, fn];
        });
    }
    private isPolicyCtor(desc: PolicyDescriptor): desc is CtorT<PolicyT<any>> {
        return !this.isPolicyT(desc) && !!(<CtorT<PolicyT<any>>>desc).prototype.handle;
    }
    private isPolicyT(desc: PolicyDescriptor): desc is PolicyT<any> {
        return !!(<PolicyT<any>>desc).handle;
    }
    
    unfinishedRoutes = 0;
    requestIndex = 0;
    private createFullRouterFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], boundRoute: any, meta: RouteMetadata) {
        const self = this;
        return async function(req: Request, res: Response) {
            let requestIndex = ++self.requestIndex;
            self.logger.verbose('router', `{${requestIndex}} beginning request: ${req.url}`);
            self.logger.verbose('router', `{${requestIndex}} unfinishedRoutes: ${++self.unfinishedRoutes}`);
            let allResults: any[] = [];
            req.policyResults = self.createPolicyResultsFn(policies, allResults);
            let initialStatusCode = res.statusCode;
            for (let q = 0; q < policies.length; q++) {
                let policy = policies[q];
                let result: any;
                let policyCtor = policy[0];
                let policyName = (policyCtor && (policyCtor.name || policyCtor)) || '(undefined)';
                try {
                    self.logger.verbose('router', `{${requestIndex}} awaiting policy ${q+1}/${policies.length} (${policyName})`);
                    result = await policy[1](req, res);
                    self.logger.verbose('router', `{${requestIndex}} policy ${policyName} returned with result ${JSON.stringify(result)}`);
                }
                catch (e) {
                    self.logger.error('router', `{${requestIndex}} policy (${policyName}) threw an exception. Serving 500 - Internal server error`);
                    self.logger.error('router', e);
                    res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
                    res.send('Internal server error');
                    self.logger.verbose('router', `{${requestIndex}} ending request. unfinishedRoutes: ${--self.unfinishedRoutes}`);
                    return;
                }
                allResults.push(result);
                if (res.statusCode !== initialStatusCode || res.headersSent) return;
            }
            
            self.logger.verbose('router', `{${requestIndex}} policies complete, creating transaction`);
            let t = meta.transaction && await self.server.transaction();
            let failed = false;
            try {
                self.logger.verbose('router', `{${requestIndex}} calling route`);
                await boundRoute(req, res, t);
                self.logger.verbose('router', `{${requestIndex}} route complete`);
            }
            catch (e) {
                self.logger.error('router', `{${requestIndex}} route threw an exception. Serving 500 - Internal server error and rolling back transaction.`);
                self.logger.error('router', e);
                res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR);
                res.send('Internal server error');
                self.logger.verbose('router', `{${requestIndex}} rolling back transaction.`);
                if (t) await t.rollback();
                self.logger.verbose('router', `{${requestIndex}} transaction rolled back. unfinishedRoutes: ${--self.unfinishedRoutes}`);
                failed = true;
            }
            finally {
                if (!failed && res.statusCode === initialStatusCode && !res.headersSent) {
                    self.logger.error('router', `{${requestIndex}} route failed to send a response. Serving 404 - Not Found`);
                    res.status(HTTP_STATUS_NOT_FOUND);
                    res.send(`Not found.`);
                    self.logger.verbose('router', `{${requestIndex}} ending request. unfinishedRoutes: ${--self.unfinishedRoutes}`);
                }
                if (!failed) {
                    self.logger.verbose('router', `{${requestIndex}} committing transaction`);
                    if (t) await t.commit();
                    self.logger.verbose('router', `{${requestIndex}} transaction committed. ending request. unfinishedRoutes: ${--self.unfinishedRoutes}`);
                }
            }
        };
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
