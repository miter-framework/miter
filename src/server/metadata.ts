import { CtorT, ControllerT, ModelT, ServiceT, PolicyT } from '../core';

export type ServerMetadata = {
   port: number | string,
   controllers?: CtorT<ControllerT>[],
   models?: CtorT<ModelT>[],
   services?: CtorT<ServiceT>[],
   policies?: CtorT<PolicyT<any>>[]
}
