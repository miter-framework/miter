import { CtorT, PolicyT } from '../../core';

export type ControllerMetadata = {
   path?: string,
   policies?: CtorT<PolicyT<any>>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');
