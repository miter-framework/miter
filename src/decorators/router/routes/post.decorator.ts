import { RouteMetadata } from '../../../metadata/router/route';
import { createRouteDecorator, RouteDecoratorFunc } from './route.decorator';

export function Post(meta: RouteMetadata | string): RouteDecoratorFunc {
    return createRouteDecorator(meta, 'post');
}
