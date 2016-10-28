import { RouteMetadata } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Put(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'put');
}
