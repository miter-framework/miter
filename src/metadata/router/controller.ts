import { PolicyDescriptor } from '../../core/policy';

export type ControllerMetadata = {
    path?: string,
    policies?: PolicyDescriptor[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');
