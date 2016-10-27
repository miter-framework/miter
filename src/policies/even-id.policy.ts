import * as express from 'express';
import { Policy } from 'decorators';

@Policy()
export class EvenIdPolicy {
   async handle(req: express.Request, res: express.Response) {
      if (+req.params['id'] % 2 != 0) {
         res.status(401).send('Permission denied!');
         return;
      }
   }
}
