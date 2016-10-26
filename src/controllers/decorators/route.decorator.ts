import { RouteDecoratorFunc, RouteFunc, RouteFuncDescriptor } from '../../router/route-func';
import { RouteMetadata, RouteMethod, ControllerRoutesSym, RouteMetadataSym } from '../../router/metadata';
import 'reflect-metadata';

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
