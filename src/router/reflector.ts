import path = require('path');
import 'reflect-metadata';
import * as express from 'express';

import './extend-request';
import { Injector, CtorT, PolicyT } from '../core';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from '../core/metadata';
import { Server } from '../server';
import { hasNoUndefined } from '../util';

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
      let policyTypes = [
         ...(this.server.meta.policies || []),
         ...(meta.policies || []),
         ...(routeMeta.policies || [])
      ];
      let policies = policyTypes.map(policyType => this.server.injector.resolveInjectable(policyType));
      if (!hasNoUndefined(policies)) throw new Error(`Could not resolve all policies for dependency injection. Controller: ${controller}.${routeFnName}`);
      let boundRoute = controller[routeFnName].bind(controller);
      
      let fullPath = path.join(...[
         '/',
         this.server.meta.path || '',
         meta.path || '',
         routeMeta.path
      ]);
      console.log(`      Adding route ${routeFnName} (${fullPath})`);
      
      if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create route ${controller}.${routeFnName}. No method set!`);
      this.router[routeMeta.method](fullPath, this.createFullRouterFn(policyTypes, policies, boundRoute));
   }
   
   private createFullRouterFn(policyTypes: CtorT<PolicyT<any>>[], policies: PolicyT<any>[], boundRoute: any) {
      const self = this;
      return async function(req: express.Request, res: express.Response) {
         let allResults: any[] = [];
         req.policyResults = self.createPolicyResultsFn(policyTypes, allResults);
         let initialStatusCode = res.statusCode;
         for (var q = 0; q < policies.length; q++) {
            let policy = policies[q];
            let result: any;
            try {
               result = await policy.handle(req, res);
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
   private createPolicyResultsFn(policyTypes: CtorT<PolicyT<any>>[], allResults: any[]) {
      return function(policyFn) {
         for (var q = 0; q < policyTypes.length; q++) {
            if (policyTypes[q] === policyFn) return allResults[q];
         }
         return undefined;
      }
   }
}
