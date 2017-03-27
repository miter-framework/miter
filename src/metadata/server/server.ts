import { Handler } from 'express';

import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { StaticModelT, ModelT, PkType } from '../../core/model';
import { ServiceT } from '../../core/service';
import { PolicyDescriptor } from '../../core/policy';

import { ProvideMetadata } from './provide';
import { OrmMetadata } from '../orm/orm';
import { JwtMetadata } from '../policies/jwt';

export type LogLevel = 'verbose' | 'warn' | 'info' | 'error';

export type ServerMetadata = {
    port: number | string,
    name?: string,
    orm?: OrmMetadata,
    jwt?: JwtMetadata,
    path?: string,
    inject?: ProvideMetadata<any>[],
    controllers?: CtorT<ControllerT>[],
    models?: StaticModelT<ModelT<PkType>>[],
    services?: CtorT<ServiceT>[],
    policies?: PolicyDescriptor[],
    middleware?: Handler[],
    allowCrossOrigin?: boolean,
    sslEnabled?: boolean,
    sslPrivateKey?: string,
    sslCertificate?: string,
    logLevel?: LogLevel | { [name: string]: LogLevel },
    debugBreakpoint?: () => void;
}
