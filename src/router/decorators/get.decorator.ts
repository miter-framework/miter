import { RouteMetadata } from '../metadata';
import { createRouteDecorator } from './route.decorator';

export function Get(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'get');
}
