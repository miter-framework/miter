import { RouteMetadata, RouteDecoratorFunc } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Get(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'get');
}
