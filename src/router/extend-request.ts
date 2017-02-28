import { CtorT } from '../core/ctor';
import { PolicyT } from '../core/policy';

declare module 'express' {
    interface Request {
        policyResults<T>(policy: CtorT<PolicyT<T>>): T | undefined;
        jwt: any;
    }
}
