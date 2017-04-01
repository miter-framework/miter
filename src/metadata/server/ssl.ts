import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';

export type SSLMetadataT = {
    enabled?: boolean,
    privateKey?: string,
    certificate?: string
};

@Injectable()
export class SSLMetadata implements SSLMetadataT {
    constructor(private _meta: SSLMetadataT, injector: Injector) {
        if (injector) injector.provide({ provide: SSLMetadata, useValue: this });
    }
    
    get enabled() {
        return this._meta.enabled || false;
    }
    get privateKey() {
        return this._meta.privateKey;
    }
    get certificate() {
        return this._meta.certificate;
    }
}
