import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../metadata';

export function Controller(meta: ControllerMetadata) {
   function cleanStringify(obj: any): string {
      return JSON.stringify(obj, function(key, val) {
         if (typeof val === 'function') {
            return val + '';
         }
         return val;
      });
   }
   
   return function(controller: any) {
      Reflect.defineMetadata(ControllerMetadataSym, meta, controller.prototype);
      
      var routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller.prototype) || [];
      Reflect.defineMetadata(ControllerRoutesSym, routes, controller.prototype);
   }
}
