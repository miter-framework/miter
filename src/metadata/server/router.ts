import { Handler } from 'express';
import { PolicyDescriptor } from '../../core/policy';
import { CtorT } from '../../core/ctor';
import { ControllerT } from '../../core/controller';
import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';

export type RouterMetadataT = {
    path?: string,
    middleware?: Handler[],
    policies?: PolicyDescriptor[],
    controllers?: CtorT<ControllerT>[]
}

@Injectable()
export class RouterMetadata implements RouterMetadataT {
    constructor(private _meta: RouterMetadataT, injector: Injector) {
        injector.provide({ provide: RouterMetadata, useValue: this });
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
