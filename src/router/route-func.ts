import * as express from 'express';

export type RouteFunc = (req: express.Request, res: express.Response) => void | Promise<void>;
export type RouteFuncDescriptor = TypedPropertyDescriptor<RouteFunc>;
export type RouteDecoratorFunc = (target: Object, propertyKey: string, propertyDescriptor: RouteFuncDescriptor) => void;
