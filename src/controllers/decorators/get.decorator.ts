import { RouteMetadata } from '../../router/metadata';
import { createRouteDecorator } from './route.decorator';

export function Get(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'get');
}
