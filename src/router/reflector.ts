import 'reflect-metadata';
import * as express from 'express';
import { Injector } from '../core';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from './metadata';
import './extend-request';

export class RouterReflector {
   constructor(private router: express.Router, private injector: Injector) {
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
   
   addRoute(controller: any, routeFnName: string, meta: ControllerMetadata, routeMeta: RouteMetadata) {
      let policyTypes = [
         ...(meta.policies || []),
         ...(routeMeta.policies || [])
      ];
      let policies = policyTypes.map(policyType => this.injector.resolveInjectable(policyType));
      let boundRoute = controller[routeFnName].bind(controller);
      
      if (typeof routeMeta.method === 'undefined') throw new Error(`Failed to create {}`);
      this.router[routeMeta.method](routeMeta.path, async function(req: express.Request, res: express.Response) {
         var allResults: any[] = [];
         req.policyResults = function(policyFn) {
            for (var q = 0; q < policyTypes.length; q++) {
               if (policyTypes[q] === policyFn) return allResults[q];
            }
         };
         let initialStatusCode = res.statusCode;
         for (var q = 0; q < policies.length; q++) {
            let policy = policies[q];
            var result = await policy.handle(req, res);
            allResults.push(result);
            if (res.statusCode !== initialStatusCode || res.headersSent) return;
         }
         
         return await boundRoute(req, res);
      });
   }
}
