import { CtorT } from '../../core/ctor';
import { PolicyDescriptor } from '../../core/policy';
import { ControllerT } from '../../core/controller';
import { InjectableMetadata } from '../services/injectable';

//TODO: figure out how to use CtorT<ControllerT> instead of CtorT<any>

export type ControllerMetadata = InjectableMetadata<any> & {
    path?: string,
    policies?: PolicyDescriptor[],
    controllers?: CtorT<any>[]
}
export const ControllerMetadataSym = Symbol.for('ControllerMetadata');
export const ControllerRoutesSym = Symbol.for('ControllerRoutes');
