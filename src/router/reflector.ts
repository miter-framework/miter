import 'reflect-metadata';
import { Request, Response } from 'express';

import { Injector } from '../core/injector';
import { PolicyDescriptor } from '../core/policy';
import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';

import { Injectable } from '../decorators/services/injectable.decorator';

import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../metadata/router/controller';
import { RouteMetadata, RouteMetadataSym } from '../metadata/router/route';
import { ServerMetadata } from '../metadata/server/server';

import { Logger } from '../services/logger';
import { TransactionService } from '../services/transaction.service';
import { RouterService } from '../services/router.service';

import { inhertitanceHierarchy } from '../util/inheritance-hierarchy';
import { hasNoUndefined } from '../util/has-no-undefined';
import { joinRoutePaths } from '../util/join-route-paths';
import { wrapPromise } from '../util/wrap-promise';
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../util/http-status-type';

import './extend-request';

@Injectable()
export class RouterReflector {
    constructor(
        private injector: Injector,
        private logger: Logger,
        private serverMeta: ServerMetadata,
        private _router: RouterService,
        private transactionService: TransactionService
    ) { }
    
    get router() {
        return this._router;
    }
    
    reflectRoutes(controllers: any[]) {
        for (let q = 0; q < controllers.length; q++) {
            this.reflectControllerRoutes(controllers[q]);
        }
    }
    
    private controllers: any = {};
    reflectControllerRoutes(controllerFn: any) {
        if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
        let controllerInst = this.controllers[controllerFn] = this.injector.resolveInjectable(controllerFn);
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
            ...(this.serverMeta.policies),
            ...(controllerMeta.policies || []),
            ...(routeMeta.policies || [])
        ];
        let policies = this.resolvePolicies(policyDescriptors);
        let boundRoute = controller[routeFnName].bind(controller);
        
        let pathPart = routeMeta.path;
        if (controller.transformPathPart) pathPart = controller.transformPathPart(pathPart) || pathPart;
        let fullPath = joinRoutePaths(...[
            this.serverMeta.path,
            controllerMeta.path || '',
            pathPart
        ]);
        if (controller.transformPath) fullPath = controller.transformPath(fullPath) || fullPath;
        
        if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create route ${controller}.${routeFnName}. No method set!`);
        this.logger.verbose('router', `& Adding route ${routeFnName} (${routeMeta.method.toUpperCase()} ${fullPath})`);
        
        (<any>this.router.expressRouter)[routeMeta.method](fullPath, this.createFullRouterFn(policies, boundRoute, routeFnName, routeMeta));
    }
    private resolvePolicies(descriptors: PolicyDescriptor[]): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][] {
        return descriptors.map((desc): [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }] => {
            let key: undefined | CtorT<PolicyT<any>>;
            let fn: { (req: Request, res: Response): Promise<any> };
            if (this.isPolicyCtor(desc)) {
                key = desc;
                let val = this.injector.resolveInjectable(desc);
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
    private createFullRouterFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: Request, res: Response): Promise<any> }][], boundRoute: any, routeName: string, meta: RouteMetadata) {
        let fullRouterFn = async function(this: RouterReflector, req: Request, res: Response) {
            let requestIndex = ++this.requestIndex;
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
            try {
                await self.transactionService.run(routeName, async () => {
                    await fullRouterFn.call(self, req, res);
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
