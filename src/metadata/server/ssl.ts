import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadata } from './server';
import { SSLMetadataT } from './ssl-t';

@Injectable({
  provide: {
    useCallback: function(meta: ServerMetadata) {
      let sslMeta = meta.originalMeta.ssl;
      return new SSLMetadata(sslMeta);
    },
    deps: [ServerMetadata],
    cache: true
  }
})
export class SSLMetadata {
  constructor(
    private _meta?: SSLMetadataT
  ) { }

  get originalMeta() {
    return this._meta;
  }

  get enabled() {
    return (this._meta && this._meta.enabled) || false;
  }
  get privateKey() {
    return (this._meta && this._meta.privateKey) || undefined;
  }
  get certificate() {
    return (this._meta && this._meta.certificate) || undefined;
  }
}
