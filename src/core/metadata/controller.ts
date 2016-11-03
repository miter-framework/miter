import { PolicyDescriptor } from '../../core';

export type ControllerMetadata = {
   path?: string,
   policies?: PolicyDescriptor[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');
