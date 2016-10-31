import { CtorT, PolicyT } from '../core';
import { PolicyMetadata, PolicyMetadataSym } from '../core/metadata';

export function Policy<T>(meta?: PolicyMetadata) {
   meta = meta || {};
   return function(policyFn: CtorT<PolicyT<T>>) {
      Reflect.defineMetadata(PolicyMetadataSym, meta, policyFn.prototype);
   }
}