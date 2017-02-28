import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { ControllerMetadata, ControllerMetadataSym, ControllerRoutesSym } from '../../metadata';

export function Controller(meta?: ControllerMetadata) {
    meta = meta || {};
    return function(controller: CtorT<ControllerT>) {
        Reflect.defineMetadata(ControllerMetadataSym, meta, controller.prototype);
        
        let routes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller.prototype) || [];
        Reflect.defineMetadata(ControllerRoutesSym, routes, controller.prototype);
    }
}
