import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';
import { ServiceMetadata, ServiceMetadataSym } from '../../metadata/services/service';
import { Injectable } from './injectable.decorator';

export function Service(meta?: ServiceMetadata) {
    meta = meta || {};
    return function(service: CtorT<ServiceT>) {
        Reflect.defineMetadata(ServiceMetadataSym, meta, service.prototype);
        Injectable()(service);
    }
}
