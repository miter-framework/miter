import { CtorT } from '../../core/ctor';
import { ServiceT } from '../../core/service';
import { ServiceMetadata, ServiceMetadataSym } from '../../metadata/services/service';

export function Service(meta?: ServiceMetadata) {
    meta = meta || {};
    return function(service: CtorT<ServiceT>) {
        Reflect.defineMetadata(ServiceMetadataSym, meta, service.prototype);
    }
}
