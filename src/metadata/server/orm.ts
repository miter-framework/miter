import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadata } from './server';
import { OrmMetadataT } from './orm-t';

import { StaticModelT, ModelT, PkType } from '../../core/model';

@Injectable({
    provide: {
        useCallback: function(meta: ServerMetadata) {
            let ormMeta = meta.originalMeta.orm;
            return new OrmMetadata(ormMeta);
        },
        deps: [ServerMetadata],
        cache: true
    }
})
export class OrmMetadata {
    constructor(
        private _meta?: OrmMetadataT
    ) { }
    
    get originalMeta() {
        return this._meta;
    }
    
    get enabled() {
        if (!this._meta || typeof this._meta.enabled === 'undefined') return true;
        return !!this._meta.enabled;
    }
    
    get models() {
        return (this._meta && this._meta.models) || [];
    }
    get recreate() {
        return !!(this._meta && this._meta.recreate);
    }
}
