import * as express from 'express';
import { CtorT } from './ctor';

export interface PolicyT<T> {
   handle(req: express.Request, res: express.Response): Promise<T>;
}
export type PolicyDescriptor = CtorT<PolicyT<any>> | PolicyT<any> | express.Handler;
