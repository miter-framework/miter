import { Injectable } from '../../decorators/services/injectable.decorator';
import { OrmMetadata } from './orm';
import { DatabaseMetadataT } from './database-t';

@Injectable({
    provide: {
        useCallback: function(meta: OrmMetadata) {
            let dbMeta = meta.originalMeta && meta.originalMeta.db;
            return !!dbMeta ? new DatabaseMetadata(dbMeta) : null;
        },
        deps: [OrmMetadata],
        cache: true
    }
})
export class DatabaseMetadata {
    constructor(private _meta: DatabaseMetadataT) {
        if (typeof _meta.host === 'string') this._domain = _meta.host;
        else {
            this._domain = _meta.host.domain;
            if (_meta.host.port) this._port = _meta.host.port;
        }
        
        this._minPool = (_meta.pool && _meta.pool.min) || 5;
        this._maxPool = (_meta.pool && _meta.pool.max) || 1000;
        this._idlePool = (_meta.pool && _meta.pool.idle) || 5 * 60 * 1000; //Five-minute default
    }
    
    get originalMeta() {
        return this._meta;
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
