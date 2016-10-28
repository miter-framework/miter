import { CtorT, PolicyT } from '../core';

export function Policy<T>() {
   return function(policyFn: CtorT<PolicyT<T>>) {
      
   }
}
