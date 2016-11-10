import { RouteMetadata } from '../../../core/metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Patch(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'patch');
}
