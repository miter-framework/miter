import * as express from 'express';
import { RouteMetadata, RouteMethod, ControllerRoutesSym, RouteMetadataSym } from '../core/metadata';
import 'reflect-metadata';

export type RouteFunc = (req: express.Request, res: express.Response) => void | Promise<void>;
export type RouteFuncDescriptor = TypedPropertyDescriptor<RouteFunc>;
export type RouteDecoratorFunc = (target: Object, propertyKey: string, propertyDescriptor: RouteFuncDescriptor) => void;

export function createRouteDecorator(meta: RouteMetadata | string, method?: RouteMethod): RouteDecoratorFunc {
   if (typeof meta === 'string') meta = { path: <string>meta };
   if (typeof method !== 'undefined') {
      if (meta.method && meta.method != method) throw new Error(`Redeclaration of route method: ${meta}`);
      meta.method = method;
   }
   else meta.method = meta.method || 'get';
   
   return function(controller: any, routeName: string, routeFn: RouteFuncDescriptor) {
      var routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller) || [];
      routes.push(routeName);
      Reflect.defineMetadata(ControllerRoutesSym, routes, controller);
      
      Reflect.defineMetadata(RouteMetadataSym, meta, controller, routeName);
   }
}

export function Route(meta: RouteMetadata): RouteDecoratorFunc {
   return createRouteDecorator(meta);
}
