import * as express from 'express';
import { Policy } from '../decorators';
import { Server } from '../server';
import * as expressJwt from 'express-jwt';
import { wrapPromise } from '../util/wrap-promise';

@Policy()
export class RequiredJwtPolicy {
   constructor(private server: Server) {
      let jwt = server.meta.jwt;
      if (typeof jwt === 'undefined') return;
      
      this.jwtHandler = expressJwt({
         secret: jwt.secret,
         userProperty: jwt.tokenProperty || 'jwt',
         credentialsRequired: true
      });
   }
   
   private jwtHandler: express.RequestHandler;
   
   async handle(req: express.Request, res: express.Response) {
      if (!this.jwtHandler) return;
      return await wrapPromise<void>(this.jwtHandler, req, res);
   }
}
