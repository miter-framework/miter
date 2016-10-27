import { PolicyCtorT } from './policy';



export type ControllerMetadata = {
   policies?: PolicyCtorT<any>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');



export type RouteMethod = 'get' | 'post';

export type RouteMetadata = {
   path: string,
   method?: RouteMethod,
   policies?: PolicyCtorT<any>[]
};
export const RouteMetadataSym = Symbol.for('RouteMetadata');
