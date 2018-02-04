import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';
import { ServiceMetadata, ServiceMetadataSym } from '../../metadata/services/service';
import { Injectable } from './injectable.decorator';

//TODO: figure out a way to make this CtorT<ServiceT> instead of CtorT<any>

export function Service(meta?: ServiceMetadata) {
    meta = meta || {};
    return function(service: CtorT<any>) {
        Reflect.defineMetadata(ServiceMetadataSym, meta, service.prototype);
        Injectable(meta)(service);
    }
}
