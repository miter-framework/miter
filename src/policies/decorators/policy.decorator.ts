import { Injectable } from '../../inject';
import { PolicyCtorT } from '../../router/policy';

export function Policy<T>() {
   return function(policyFn: PolicyCtorT<T>) {
      return Injectable()(policyFn);
   }
}
