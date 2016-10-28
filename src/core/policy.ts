import * as express from 'express';

export interface PolicyT<T> {
   handle(req: express.Request, res: express.Response): Promise<T>;
}
