import { PolicyDescriptor } from '../../core/policy';

export type RouteMethod = 'get' | 'post' | 'put' | 'head' | 'delete' | 'options' | 'trace' | 'copy' | 'lock' | 'mkcol' |
                          'move' | 'purge' | 'propfind' | 'proppatch' | 'unlock' | 'report' | 'mkactivity' | 'checkout' |
                          'merge' | 'm-search' | 'notify' | 'subscribe' | 'unsubscribe' | 'patch' | 'search' | 'connect';

export type RouteMetadata = {
    path: string,
    transaction?: boolean,
    method?: RouteMethod,
    policies?: PolicyDescriptor[]
};
export const RouteMetadataSym = Symbol.for('RouteMetadata');
