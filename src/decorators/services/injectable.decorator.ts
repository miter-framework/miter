import { CtorT } from '../../core';

export function Injectable() {
    return function(service: CtorT<any>) {
    }
}
