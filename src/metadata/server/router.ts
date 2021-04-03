import { Injectable } from '../../decorators/services/injectable.decorator';
import { ServerMetadata } from './server';
import { RouterMetadataT } from './router-t';

import { Handler } from 'express';
import { PolicyDescriptor } from '../../core/policy';
import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';

@Injectable({
  provide: {
    useCallback: function(meta: ServerMetadata) {
      let routerMeta = meta.originalMeta.router;
      return !!routerMeta ? new RouterMetadata(routerMeta) : null;
    },
    deps: [ServerMetadata],
    cache: true
  }
})
export class RouterMetadata {
  constructor(
    private _meta: RouterMetadataT
  ) { }

  get originalMeta() {
    return this._meta;
  }

  get path() {
    return this._meta.path || '';
  }
  get middleware() {
    return this._meta.middleware || [];
  }
  get policies() {
    return this._meta.policies || [];
  }
  get controllers() {
    return this._meta.controllers || [];
  }
}
