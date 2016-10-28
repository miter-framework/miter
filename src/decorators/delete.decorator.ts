import { RouteMetadata, RouteDecoratorFunc } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Delete(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'delete');
}
