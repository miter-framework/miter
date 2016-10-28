import { RouteMetadata } from '../router';
import { createRouteDecorator } from './route.decorator';

export function Delete(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'delete');
}
