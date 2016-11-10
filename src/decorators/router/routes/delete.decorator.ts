import { RouteMetadata } from '../../../core/metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Delete(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'delete');
}
