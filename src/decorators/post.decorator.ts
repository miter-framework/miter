import { RouteMetadata, RouteDecoratorFunc } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Post(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'post');
}
