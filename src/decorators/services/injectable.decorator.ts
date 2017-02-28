import { CtorT } from '../../core/ctor';

export function Injectable() {
    return function(service: CtorT<any>) {
    }
}
