import * as express from 'express';
import { CtorT, ControllerT, StaticModelT, ModelT, PkType, ServiceT, PolicyDescriptor } from '../../core';

export type DatabaseMetadata = {
   name: string,
   user: string,
   password: string,
   host: string | { domain: string, port: number },
   dialect?: string
}

export type OrmMetadata = {
   enabled?: boolean,
   db?: DatabaseMetadata
}

export type JwtMetadata = {
   secret: string | Buffer,
   tokenProperty?: string
}

export type ServerMetadata = {
   port: number | string,
   orm?: OrmMetadata,
   jwt?: JwtMetadata,
   path?: string,
   controllers?: CtorT<ControllerT>[],
   models?: StaticModelT<ModelT<PkType>>[],
   services?: CtorT<ServiceT>[],
   policies?: PolicyDescriptor[],
   middleware?: express.Handler[]
}
