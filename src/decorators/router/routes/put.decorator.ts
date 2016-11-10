import { RouteMetadata } from '../../../metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Put(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'put');
}
