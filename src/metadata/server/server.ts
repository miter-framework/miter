import { PolicyDescriptor } from '../../core/policy';
import { Injector } from '../../core/injector';

import { Injectable } from '../../decorators/services/injectable.decorator';

import { OrmMetadataT, OrmMetadata } from './orm';
import { SSLMetadataT, SSLMetadata } from './ssl';
import { RouterMetadataT, RouterMetadata } from './router';

import { ProvideMetadata } from './provide';

import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';

import { JwtMetadataT, JwtMetadata } from './jwt';
export type LogLevel = 'verbose' | 'warn' | 'info' | 'error';

export type ServerMetadataT = {
    name: string,
    
    port?: number | string,
    allowCrossOrigin?: boolean,
    ssl?: SSLMetadataT,
    router?: RouterMetadataT,
    
    orm?: OrmMetadataT,
    
    services?: CtorT<ServiceT>[],
    
    inject?: ProvideMetadata<any>[],
    
    //TODO: generalize these properties, along with Task
    jwt?: JwtMetadataT | null,
    logLevel?: LogLevel | { [name: string]: LogLevel },
    debugBreakpoint?: () => void
};

@Injectable()
export class ServerMetadata implements ServerMetadataT {
    constructor(private _meta: ServerMetadataT, injector: Injector) {
        if (injector) injector.provide({ provide: ServerMetadata, useValue: this });
        
        this._ssl = new SSLMetadata(this._meta.ssl || {}, injector);
        this._router = new RouterMetadata(this._meta.router || {}, injector);
        this._orm = new OrmMetadata(this._meta.orm || {}, injector);
        
        if (this._meta.jwt) this._jwt = new JwtMetadata(this._meta.jwt, injector);
        else if (injector) injector.provide({ provide: JwtMetadata, useValue: this._jwt });
    }
    
    get name() {
        return this._meta.name;
    }
    
    get port() {
        return this._meta.port || 80;
    }
    get allowCrossOrigin() {
        return this._meta.allowCrossOrigin || false;
    }
    
    private _ssl: SSLMetadata;
    get ssl() {
        return this._ssl;
    }
    
    private _router: RouterMetadata;
    get router() {
        return this._router;
    }
    
    private _orm: OrmMetadata;
    get orm() {
        return this._orm;
    }
    
    get services() {
        return this._meta.services || [];
    }
    
    get inject() {
        return this._meta.inject || [];
    }
    
    //TODO: Generalize. See ServerMetadataT
    private _jwt: JwtMetadata | null = null;
    get jwt() {
        return this._jwt;
    }
    get logLevel() {
        return this._meta.logLevel || 'warn';
    }
    get debugBreakpoint() {
        return this._meta.debugBreakpoint || (() => void(0));
    }
}
