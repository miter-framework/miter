import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadata } from './server';
import { JwtMetadataT } from './jwt-t';

@Injectable({
    provide: {
        useCallback: function(meta: ServerMetadata) {
            let jwtMeta = meta.originalMeta.jwt;
            return !!jwtMeta ? new JwtMetadata(jwtMeta) : null;
        },
        deps: [ServerMetadata],
        cache: true
    }
})
export class JwtMetadata {
    constructor(
        private _meta: JwtMetadataT
    ) { }
    
    get originalMeta() {
        return this._meta;
    }
    
    get secret() {
        return this._meta.secret;
    }
    get tokenProperty() {
        return this._meta.tokenProperty || 'jwt';
    }
}
