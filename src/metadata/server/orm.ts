import { StaticModelT, ModelT, PkType } from '../../core/model';
import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';
import { DatabaseMetadataT, DatabaseMetadata } from './database';

export type OrmMetadataT = {
    enabled?: boolean,
    db?: DatabaseMetadataT,
    recreate?: boolean,
    models?: StaticModelT<ModelT<PkType>>[]
};

@Injectable()
export class OrmMetadata implements OrmMetadataT {
    constructor(private _meta: OrmMetadataT, injector: Injector) {
        if (injector) injector.provide({ provide: OrmMetadata, useValue: this });
        if (this._meta.db) this._db = new DatabaseMetadata(this._meta.db, injector);
        else if (injector) injector.provide({ provide: DatabaseMetadata, useValue: null });
    }
    
    get enabled() {
        return this._meta.enabled || false;
    }
    get models() {
        return this._meta.models || [];
    }
    get recreate() {
        return this._meta.recreate;
    }
    
    private _db: DatabaseMetadata;
    get db() {
        return this._db;
    }
}
