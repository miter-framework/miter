import { CtorT } from '../../core/ctor';
import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';
import { TemplateService } from '../../services/template.service';

export type ViewsMetadataT = {
    fileRoot?: string,
    engine: CtorT<TemplateService> | string | null;
};

@Injectable()
export class ViewsMetadata implements ViewsMetadataT {
    constructor(private _meta: ViewsMetadataT, injector: Injector) {
        if (injector) injector.provide({ provide: ViewsMetadata, useValue: this });
    }
    
    get fileRoot() {
        return this._meta.fileRoot;
    }
    
    get engine() {
        return this._meta.engine;
    }
}
