import { CtorT, PolicyT } from '../core';



export type ControllerMetadata = {
   policies?: CtorT<PolicyT<any>>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');



export type RouteMethod = 'get' | 'post' | 'put' | 'head' | 'delete' | 'options' | 'trace' | 'copy' | 'lock' | 'mkcol' |
                          'move' | 'purge' | 'propfind' | 'proppatch' | 'unlock' | 'report' | 'mkactivity' | 'checkout' |
                          'merge' | 'm-search' | 'notify' | 'subscribe' | 'unsubscribe' | 'patch' | 'search' | 'connect';

export type RouteMetadata = {
   path: string,
   method?: RouteMethod,
   policies?: CtorT<PolicyT<any>>[]
};
export const RouteMetadataSym = Symbol.for('RouteMetadata');
