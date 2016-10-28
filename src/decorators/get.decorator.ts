import { RouteMetadata } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Get(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'get');
}
