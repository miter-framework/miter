import { CtorT } from '../../core/ctor';
import { MetadataMetadataSym } from '../../metadata/services/metadata';

export function Meta(name: string, value: string) {
  return function(injectable: CtorT<any>) {
    let map: Map<string, string> | undefined = Reflect.getMetadata(MetadataMetadataSym, injectable.prototype);
    if (!map) {
      map = new Map<string, string>();
      Reflect.defineMetadata(MetadataMetadataSym, map, injectable.prototype);
    }
    map.set(name, value);
  }
}
