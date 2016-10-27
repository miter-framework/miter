import { CtorT } from 'inject';
import { PolicyT } from './policy';



export type ControllerMetadata = {
   policies?: CtorT<PolicyT<any>>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');



export type RouteMethod = 'get' | 'post';

export type RouteMetadata = {
   path: string,
   method?: RouteMethod,
   policies?: CtorT<PolicyT<any>>[]
};
export const RouteMetadataSym = Symbol.for('RouteMetadata');
