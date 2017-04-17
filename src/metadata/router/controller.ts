import { CtorT } from '../../core/ctor';
import { PolicyDescriptor } from '../../core/policy';
import { ControllerT } from '../../core/controller';

export type ControllerMetadata = {
    path?: string,
    policies?: PolicyDescriptor[],
    controllers?: CtorT<ControllerT>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');
