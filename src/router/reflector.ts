import 'reflect-metadata';
import * as express from 'express';

import './extend-request';

import { Injector, PolicyDescriptor, CtorT, PolicyT } from '../core';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from '../metadata';
import { Server } from '../server';
import { Logger } from '../services/logger';
import { inhertitanceHierarchy, hasNoUndefined, joinRoutePaths, wrapPromise, clc } from '../util';

export class RouterReflector {
    constructor(private server: Server, private router: express.Router) {
    }
    
    get logger() {
        return this.server.logger;
    }
    
    reflectRoutes(controllers: any[]) {
        for (var q = 0; q < controllers.length; q++) {
            this.reflectControllerRoutes(controllers[q]);
        }
    }
    
    private controllers: any = {};
    reflectControllerRoutes(controllerFn: any) {
        if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
        var controllerInst = this.controllers[controllerFn] = this.server.injector.resolveInjectable(controllerFn);
        var controllerProto = controllerFn.prototype;
        
        var meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controllerProto);
        if (!meta) throw new Error(`Expecting class with @Controller decorator, could not reflect routes for ${controllerProto}.`);
        this.logger.info('router', `Reflecting routes for controller ${controllerFn.name}`);
        
        let routes = this.reflectRouteMeta(controllerProto);
        for (let q = 0; q < routes.length; q++) {
            let [routeFnName, routeMetaArr] = routes[q];
            for (var w = 0; w < routeMetaArr.length; w++) {
                let routeMeta = routeMetaArr[w];
                this.addRoute(controllerInst, routeFnName, meta, routeMeta);
            }
        }
    }
    
    private reflectRouteMeta(controllerProto): [string, RouteMetadata[]][] {
        let hierarchy = inhertitanceHierarchy(controllerProto);
        let routeMeta: [string, RouteMetadata[]][] = [];
        for (let r = 0; r < hierarchy.length; r++) {
            let fn = hierarchy[r].prototype;
            let routeNames: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, fn) || [];
            for (var q = 0; q < routeNames.length; q++) {
                var routeFnName: string = routeNames[q];
                var routeMetaArr: RouteMetadata[] = Reflect.getOwnMetadata(RouteMetadataSym, fn, routeFnName) || [];
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
        
        this.router[routeMeta.method](fullPath, this.createFullRouterFn(policies, boundRoute));
    }
    private resolvePolicies(descriptors: PolicyDescriptor[]): [undefined | CtorT<PolicyT<any>>, { (req: express.Request, res: express.Response): Promise<any> }][] {
        return descriptors.map((desc): [undefined | CtorT<PolicyT<any>>, { (req: express.Request, res: express.Response): Promise<any> }] => {
            let key: undefined | CtorT<PolicyT<any>>;
            let fn: { (req: express.Request, res: express.Response): Promise<any> };
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
                fn = async function(req: express.Request, res: express.Response) {
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
    
    private createFullRouterFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: express.Request, res: express.Response): Promise<any> }][], boundRoute: any) {
        const self = this;
        return async function(req: express.Request, res: express.Response) {
            let allResults: any[] = [];
            req.policyResults = self.createPolicyResultsFn(policies, allResults);
            let initialStatusCode = res.statusCode;
            for (var q = 0; q < policies.length; q++) {
                let policy = policies[q];
                let result: any;
                try {
                    result = await policy[1](req, res);
                    let policyCtor = policy[0];
                    let policyName = (policyCtor && (policyCtor.name || policyCtor)) || '(undefined)';
                    self.logger.verbose('router', `Policy ${policyName} returned with result ${JSON.stringify(result)}`);
                }
                catch (e) {
                    self.logger.error('router', 'A policy threw an exception. Serving 500 - Internal server error');
                    self.logger.error('router', e);
                    res.status(500);
                    res.send('Internal server error');
                    return;
                }
                allResults.push(result);
                if (res.statusCode !== initialStatusCode || res.headersSent) return;
            }
            
            try {
                await boundRoute(req, res);
            }
            catch (e) {
                self.logger.error('router', 'A route threw an exception. Serving 500 - Internal server error');
                self.logger.error('router', e);
                res.status(500);
                res.send('Internal server error');
                return;
            }
            if (res.statusCode === initialStatusCode && !res.headersSent) {
                self.logger.error('router', `A route failed to send a response. Serving 404 - Not Found`);
                res.status(404);
                res.send(`Not found.`);
            }
        };
    }
    private createPolicyResultsFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: express.Request, res: express.Response): Promise<any> }][], allResults: any[]) {
        let keys = policies.map(poli => poli[0]);
        return function(policyFn) {
            if (typeof policyFn === 'number') return allResults[policyFn];
            for (var q = 0; q < keys.length; q++) {
                if (keys[q] === policyFn) return allResults[q];
            }
            return undefined;
        }
    }
}
