import { RouteMetadata, RouteDecoratorFunc } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Put(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'put');
}
