import { RouteMetadata } from '../../../metadata';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Patch(meta: RouteMetadata | string): RouteDecoratorFunc {
   return createRouteDecorator(meta, 'patch');
}
