import { CtorT } from '../../core/ctor';
import { InjectableMetadata, InjectableMetadataSym } from '../../metadata/services/injectable';

export function Injectable<T>(meta?: InjectableMetadata<T>) {
    meta = meta || {};
    return function(injectable: CtorT<T>) {
        Reflect.defineMetadata(InjectableMetadataSym, meta, injectable.prototype);
    }
}
