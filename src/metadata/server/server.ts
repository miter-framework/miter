import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadataT } from './server-t';

import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';

@Injectable({
    provide: {
        useCallback: function(meta: ServerMetadataT) {
            return new ServerMetadata(meta);
        },
        deps: ['server-meta'],
        cache: true
    }
})
export class ServerMetadata {
    constructor(
        private _meta: ServerMetadataT
    ) { }
    
    get originalMeta() {
        return this._meta;
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
    
    get services() {
        return this._meta.services || [];
    }
    
    get inject() {
        return this._meta.inject || [];
    }
    
    get logLevel() {
        return this._meta.logLevel || 'warn';
    }
    get debugBreakpoint() {
        return this._meta.debugBreakpoint || (() => void(0));
    }
}
