import { CtorT, ControllerT, StaticModelT, ModelT, PkType, ServiceT, PolicyT } from '../../core';

export type ServerMetadata = {
   port: number | string,
   path?: string,
   controllers?: CtorT<ControllerT>[],
   models?: StaticModelT<ModelT<PkType>>[],
   services?: CtorT<ServiceT>[],
   policies?: CtorT<PolicyT<any>>[]
}
