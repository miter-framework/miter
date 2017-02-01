import * as express from 'express';
import { RouteMetadata, RouteMethod, ControllerRoutesSym, RouteMetadataSym } from '../../../metadata';
import 'reflect-metadata';

export type RouteFunc = (req: express.Request, res: express.Response) => void | Promise<void>;
export type RouteFuncDescriptor = TypedPropertyDescriptor<RouteFunc>;
export type RouteDecoratorFunc = (target: Object, propertyKey: string, propertyDescriptor: RouteFuncDescriptor) => void;

export function createRouteDecorator(pathOrMeta: RouteMetadata | string, method?: RouteMethod): RouteDecoratorFunc {
    if (typeof pathOrMeta === 'string') pathOrMeta = { path: <string>pathOrMeta };
    if (typeof method !== 'undefined') {
        if (pathOrMeta.method && pathOrMeta.method != method) throw new Error(`Redeclaration of route method: ${pathOrMeta}`);
        pathOrMeta.method = method;
    }
    else pathOrMeta.method = pathOrMeta.method || 'get';
    let meta = pathOrMeta;

    return function(controller: any, routeName: string, routeFn: RouteFuncDescriptor) {
        let controllerRoutes: string[] = Reflect.getOwnMetadata(ControllerRoutesSym, controller) || [];
        if (!controllerRoutes.find(route => route == routeName)) controllerRoutes.push(routeName);
        Reflect.defineMetadata(ControllerRoutesSym, controllerRoutes, controller);
        
        let methodRoutes: RouteMetadata[] = Reflect.getOwnMetadata(RouteMetadataSym, controller, routeName) || [];
        methodRoutes.push(meta);
        Reflect.defineMetadata(RouteMetadataSym, methodRoutes, controller, routeName);
    }
}

export function Route(meta: RouteMetadata): RouteDecoratorFunc {
    return createRouteDecorator(meta);
}
