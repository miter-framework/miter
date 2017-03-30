import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';

export type Charset = 'utf8' | 'utf8mb4';

export type DatabaseMetadataT = {
    name: string,
    user: string,
    password: string,
    host: string | { domain: string, port?: number },
    dialect?: string,
    charset?: Charset,
    pool?: {
        min?: number,
        max?: number,
        idle?: number
    }
};

@Injectable()
export class DatabaseMetadata implements DatabaseMetadataT {
    constructor(private _meta: DatabaseMetadataT, injector: Injector) {
        injector.provide({ provide: DatabaseMetadata, useValue: this });
        
        if (typeof _meta.host === 'string') this._domain = _meta.host;
        else {
            this._domain = _meta.host.domain;
            if (_meta.host.port) this._port = _meta.host.port;
        }
        
        this._minPool = (_meta.pool && _meta.pool.min) || 5;
        this._maxPool = (_meta.pool && _meta.pool.max) || 1000;
        this._idlePool = (_meta.pool && _meta.pool.idle) || 5 * 60 * 1000; //Five-minute default
    }
    
    get name() {
        return this._meta.name;
    }
    get user() {
        return this._meta.user;
    }
    get password() {
        return this._meta.password;
    }
    private _domain: string;
    private _port: number = 3306;
    get host() {
        return { domain: this._domain, port: this._port };
    }
    
    get dialect() {
        return this._meta.dialect || 'mysql';
    }
    
    get charset() {
        return this._meta.charset || 'utf8';
    }
    
    private _minPool: number;
    private _maxPool: number;
    private _idlePool: number;
    get pool() {
        return { min: this._minPool, max: this._maxPool, idle: this._idlePool };
    }
}
