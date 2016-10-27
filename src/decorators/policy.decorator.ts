import { CtorT } from 'inject';
import { PolicyT } from 'router';

export function Policy<T>() {
   return function(policyFn: CtorT<PolicyT<T>>) {
      
   }
}
