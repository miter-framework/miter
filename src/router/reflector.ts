import 'reflect-metadata';
import * as express from 'express';

import './extend-request';
import { Injector, PolicyDescriptor, CtorT, PolicyT } from '../core';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from '../core/metadata';
import { Server } from '../server';
import { hasNoUndefined } from '../util/has-no-undefined';
import { joinRoutePaths } from '../util/join-route-paths';
import { wrapPromise } from '../util/wrap-promise';

export class RouterReflector {
   constructor(private server: Server, private router: express.Router) {
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
      console.log(`    Reflecting routes for controller ${controllerFn.name}`);
      
      var routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controllerProto) || [];
      for (var q = 0; q < routes.length; q++) {
         var routeFnName: string = routes[q];
         var routeMeta: RouteMetadata = Reflect.getOwnMetadata(RouteMetadataSym, controllerProto, routeFnName);
         if (!routeMeta) throw new Error(`Could not find route metadata for route ${controllerFn}.${routeFnName}.`);
         
         this.addRoute(controllerInst, routeFnName, meta, routeMeta);
      }
   }
   
   private addRoute(controller: any, routeFnName: string, meta: ControllerMetadata, routeMeta: RouteMetadata) {
      let policyDescriptors = [
         ...(this.server.meta.policies || []),
         ...(meta.policies || []),
         ...(routeMeta.policies || [])
      ];
      let policies = this.resolvePolicies(policyDescriptors);
      let boundRoute = controller[routeFnName].bind(controller);
      
      let fullPath = joinRoutePaths(...[
         this.server.meta.path || '',
         meta.path || '',
         routeMeta.path
      ]);
      console.log(`      Adding route ${routeFnName} (${fullPath})`);
      
      if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create route ${controller}.${routeFnName}. No method set!`);
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
            }
            catch (e) {
               console.error(e);
               console.log('Serving 500 - Internal server error');
               res.status(500);
               res.send('Internal server error');
               return;
            }
            allResults.push(result);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
         }
         
         try {
            return await boundRoute(req, res);
         }
         catch (e) {
            console.error(e);
            console.log('Serving 500 - Internal server error');
            res.status(500);
            res.send('Internal server error');
         }
      };
   }
   private createPolicyResultsFn(policies: [undefined | CtorT<PolicyT<any>>, { (req: express.Request, res: express.Response): Promise<any> }][], allResults: any[]) {
      let keys = policies.map(poli => poli[0]);
      return function(policyFn) {
         for (var q = 0; q < keys.length; q++) {
            if (keys[q] === policyFn) return allResults[q];
         }
         return undefined;
      }
   }
}
