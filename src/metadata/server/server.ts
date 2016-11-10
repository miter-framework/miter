import * as express from 'express';
import { CtorT, ControllerT, StaticModelT, ModelT, PkType, ServiceT, PolicyDescriptor } from '../../core';
import { ProvideMetadata } from './provide';
import { OrmMetadata } from '../orm';
import { JwtMetadata } from '../policies';

export type ServerMetadata = {
   port: number | string,
   orm?: OrmMetadata,
   jwt?: JwtMetadata,
   path?: string,
   inject?: ProvideMetadata<any>[],
   controllers?: CtorT<ControllerT>[],
   models?: StaticModelT<ModelT<PkType>>[],
   services?: CtorT<ServiceT>[],
   policies?: PolicyDescriptor[],
   middleware?: express.Handler[],
   allowCrossOrigin?: boolean
}
