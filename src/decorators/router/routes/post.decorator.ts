import { RouteMetadata } from '../../../core/metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Post(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'post');
}
