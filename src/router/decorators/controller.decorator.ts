import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../metadata';

export function Controller(meta: ControllerMetadata) {
   return function(controller: any) {
      Reflect.defineMetadata(ControllerMetadataSym, meta, controller);
      
      var routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller) || [];
      Reflect.defineMetadata(ControllerRoutesSym, routes, controller);
   }
}
