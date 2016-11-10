import { CtorT, ServiceT } from '../../core';
import { ServiceMetadata, ServiceMetadataSym } from '../../metadata';

export function Service(meta?: ServiceMetadata) {
   meta = meta || {};
   return function(service: CtorT<ServiceT>) {
      Reflect.defineMetadata(ServiceMetadataSym, meta, service.prototype);
   }
}
