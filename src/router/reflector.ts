import 'reflect-metadata';
import * as express from 'express';
import { AppControllers } from '../controllers';

import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym, RouteMetadata, RouteMetadataSym } from './metadata';

export class RouterReflector {
   constructor(private router: express.Router) {
      this.reflectRoutes(AppControllers);
   }
   
   reflectRoutes(controllers: any[]) {
      for (var q = 0; q < controllers.length; q++) {
         this.addController(controllers[q]);
      }
   }
   
   private controllers: any = {};
   addController(controllerFn: any) {
      if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
      var controllerInst = this.controllers[controllerFn] = new controllerFn();
      
      var meta: ControllerMetadata = Reflect.getOwnMetadata(ControllerMetadataSym, controllerFn);
      if (!meta) throw new Error(`Expecting class with @Controller decorator, could not reflect routes for ${controllerFn}.`);
      
      var routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controllerFn) || [];
      console.log(`Reflecting routes for ${controllerFn.name}. Route count: ${routes.length}. ControllerRoutesSym: ${ControllerRoutesSym.toString()}`);
      for (var q = 0; q < routes.length; q++) {
         var routeFnName: string = routes[q];
         var routeMeta: RouteMetadata = Reflect.getOwnMetadata(RouteMetadataSym, controllerFn, routeFnName);
         if (!routeMeta) throw new Error(`Could not find route metadata for route ${controllerFn}.${routeFnName}.`);
         
         this.addRoute(controllerInst, routeFnName, meta, routeMeta);
      }
   }
   
   addRoute(controller: any, routeFnName: string, meta: ControllerMetadata, routeMeta: RouteMetadata) {
      this.router[routeMeta.method](routeMeta.path, controller[routeFnName].bind(controller));
   }
}
