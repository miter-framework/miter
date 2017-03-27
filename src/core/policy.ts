import { Request, Response, Handler } from 'express';
import { CtorT } from './ctor';

export interface PolicyT<T> {
    handle(req: Request, res: Response): Promise<T>;
}
export type PolicyDescriptor = CtorT<PolicyT<any>> | PolicyT<any> | Handler;
