import { RouteMetadata } from '../core/metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Put(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'put');
}
