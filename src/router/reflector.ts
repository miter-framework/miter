import path = require('path');
import 'reflect-metadata';
import * as express from 'express';
import { Injector, CtorT, PolicyT } from '../core';
import { Server } from '../server';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from './metadata';
import './extend-request';
import { hasNoUndefined } from '../util';

export class RouterReflector {
   constructor(private server: Server, private router: express.Router, private injector: Injector) {
   }
   
   reflectRoutes(controllers: any[]) {
      for (var q = 0; q < controllers.length; q++) {
         this.reflectControllerRoutes(controllers[q]);
      }
   }
   
   private controllers: any = {};
   reflectControllerRoutes(controllerFn: any) {
      if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
      var controllerInst = this.controllers[controllerFn] = this.injector.resolveInjectable(controllerFn);
      var controllerProto = controllerFn.prototype;
      
      var meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controllerProto);
      if (!meta) throw new Error(`Expecting class with @Controller decorator, could not reflect routes for ${controllerProto}.`);
      
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
      let policies = policyTypes.map(policyType => this.injector.resolveInjectable(policyType));
      if (!hasNoUndefined(policies)) throw new Error(`Could not resolve all policies for dependency injection. Controller: ${controller}.${routeFnName}`);
      let boundRoute = controller[routeFnName].bind(controller);
      
      let fullPath = path.join(...[
         this.server.meta.path || '',
         meta.path || '',
         routeMeta.path
      ]);
      
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
            var result = await policy.handle(req, res);
            allResults.push(result);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
         }
         
         return await boundRoute(req, res);
      };
   }
   private createPolicyResultsFn(policyTypes: CtorT<PolicyT<any>>[], allResults: any[]) {
      return function(policyFn) {
         for (var q = 0; q < policyTypes.length; q++) {
            if (policyTypes[q] === policyFn) return allResults[q];
         }
      }
   }
}
