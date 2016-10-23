import { RouteMetadata } from '../metadata';
import { createRouteDecorator } from './route.decorator';

export function Post(meta: RouteMetadata | string) {
   return createRouteDecorator(meta, 'post');
}
