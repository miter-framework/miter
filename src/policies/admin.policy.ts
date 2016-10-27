import * as express from 'express';
import { Policy } from './decorators';

@Policy()
export class AdminPolicy {
   async handle(req: express.Request, res: express.Response) {
   }
}
