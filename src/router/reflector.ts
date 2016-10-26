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
         this.reflectControllerRoutes(controllers[q]);
      }
   }
   
   private controllers: any = {};
   reflectControllerRoutes(controllerFn: any) {
      if (this.controllers[controllerFn]) throw new Error(`A controller was passed to the router-reflector twice: ${controllerFn}.`);
      var controllerInst = this.controllers[controllerFn] = new controllerFn();
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
      this.router[routeMeta.method](routeMeta.path, controller[routeFnName].bind(controller));
   }
}
