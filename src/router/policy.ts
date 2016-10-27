import * as express from 'express';

export interface PolicyT<T> {
   handle(req: express.Request, res: express.Response): Promise<T>;
}
export type PolicyCtorT<T> = { new (...any): PolicyT<T> };
