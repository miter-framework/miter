import * as express from 'express';

export type VoidT = void | Promise<void>;
export type RouteFunc = (req: express.Request, res: express.Response, next?: express.NextFunction) => VoidT;
export type RouteFuncDescriptor = TypedPropertyDescriptor<RouteFunc>;
export type RouteDecoratorFunc = (target: Object, propertyKey: string, propertyDescriptor: RouteFuncDescriptor) => void;
