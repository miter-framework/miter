import { CtorT, PolicyT } from '../core';

declare module 'express' {
    interface Request {
        policyResults<T>(policy: CtorT<PolicyT<T>>): T | undefined;
        jwt: any;
    }
}
