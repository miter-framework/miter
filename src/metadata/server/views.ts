import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadata } from './server';
import { ViewsMetadataT } from './views-t';

import { CtorT } from '../../core/ctor';
import { TemplateService } from '../../services/template.service';

@Injectable({
    provide: {
        useCallback: function(meta: ServerMetadata) {
            let viewsMeta = meta.originalMeta.views;
            return !!viewsMeta ? new ViewsMetadata(viewsMeta) : null;
        },
        deps: [ServerMetadata],
        cache: true
    }
})
export class ViewsMetadata {
    constructor(
        private _meta: ViewsMetadataT
    ) { }
    
    get originalMeta() {
        return this._meta;
    }
    
    get fileRoot() {
        return this._meta.fileRoot;
    }
    
    get engine() {
        return this._meta.engine;
    }
}
