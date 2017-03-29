import { Handler } from 'express';

import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { StaticModelT, ModelT, PkType } from '../../core/model';
import { ServiceT } from '../../core/service';
import { PolicyDescriptor } from '../../core/policy';

import { Injectable } from '../../decorators/services/injectable.decorator';

import { ProvideMetadata } from './provide';
import { OrmMetadata } from '../orm/orm';
import { JwtMetadata } from '../policies/jwt';

export type LogLevel = 'verbose' | 'warn' | 'info' | 'error';

export type ServerMetadataT = {
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

@Injectable()
export class ServerMetadata implements ServerMetadataT {
    constructor(private _meta: ServerMetadataT = { port: 80 }) {
    }
    
    get port() {
        return this._meta.port;
    }
    
    get name() {
        return this._meta.name || '';
    }
    
    get path() {
        return this._meta.path || '';
    }
    get orm() {
        return this._meta.orm;
    }
    get jwt() {
        return this._meta.jwt;
    }
    get inject() {
        return this._meta.inject || [];
    }
    
    get controllers() {
        return this._meta.controllers || [];
    }
    get models() {
        return this._meta.models || [];
    }
    get services() {
        return this._meta.services || [];
    }
    get policies() {
        return this._meta.policies || [];
    }
    get middleware() {
        return this._meta.middleware || [];
    }
    
    get allowCrossOrigin() {
        return this._meta.allowCrossOrigin || false;
    }
    
    get sslEnabled() {
        return this._meta.sslEnabled || false;
    }
    get sslPrivateKey() {
        return this._meta.sslPrivateKey;
    }
    get sslCertificate() {
        return this._meta.sslCertificate;
    }
    
    get logLevel() {
        return this._meta.logLevel || 'warn';
    }
    
    get debugBreakpoint() {
        return this._meta.debugBreakpoint || (() => void(0));
    }
}
