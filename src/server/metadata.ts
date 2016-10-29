import { CtorT, ControllerT, ModelT, ServiceT, PolicyT } from '../core';

export type ServerMetadata = {
   port: number | string,
   path?: string,
   controllers?: CtorT<ControllerT>[],
   models?: CtorT<ModelT>[],
   services?: CtorT<ServiceT>[],
   policies?: CtorT<PolicyT<any>>[]
}



export type ServiceMetadata = {
   
}
export const ServiceMetadataSym = Symbol.for('SeviceMetadata');
