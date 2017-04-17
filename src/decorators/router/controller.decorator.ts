import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../../metadata';

export function Controller(meta?: ControllerMetadata | string) {
    let controllerMeta = typeof meta === 'string'? { path: meta } : (meta || {});
    return function(controller: CtorT<ControllerT>) {
        let previousMeta = Reflect.getOwnMetadata(ControllerMetadataSym, controller.prototype);
        if (previousMeta) {
            if (!(<any>previousMeta).extension) throw new Error(`A class can't have multiple Controller decorators attached to it! See ${controller.name || controller}`);
            if (previousMeta.policies) {
                if (!controllerMeta.policies) controllerMeta.policies = [];
                controllerMeta.policies.push.apply(controllerMeta.policies, previousMeta.policies);
            }
        }
        Reflect.defineMetadata(ControllerMetadataSym, controllerMeta, controller.prototype);
        
        let routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller.prototype) || [];
        Reflect.defineMetadata(ControllerRoutesSym, routes, controller.prototype);
    }
}
