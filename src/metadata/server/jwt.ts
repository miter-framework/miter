import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';

export type JwtMetadataT = {
    secret: string | Buffer,
    tokenProperty?: string
}

@Injectable()
export class JwtMetadata implements JwtMetadataT {
    constructor(private _meta: JwtMetadataT, injector: Injector) {
        injector.provide({ provide: JwtMetadata, useValue: this });
    }
    
    get secret() {
        return this._meta.secret;
    }
    get tokenProperty() {
        return this._meta.tokenProperty || 'jwt';
    }
}
