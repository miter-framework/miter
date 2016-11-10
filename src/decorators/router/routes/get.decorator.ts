import { RouteMetadata } from '../../../core/metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Get(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'get');
}
