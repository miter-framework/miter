import * as express from 'express';
import * as expressJwt from 'express-jwt';

import { Policy } from '../decorators';
import { Server } from '../server';
import { wrapPromise } from '../util/wrap-promise';

@Policy()
export class JwtBasePolicy {
   constructor(private server: Server, credentialsRequired: boolean) {
      let jwt = server.meta.jwt;
      if (typeof jwt === 'undefined') return;
      
      this.property = jwt.tokenProperty || 'jwt';
      this.jwtHandler = expressJwt({
         secret: jwt.secret,
         userProperty: this.property,
         credentialsRequired: credentialsRequired
      });
   }
   
   private property: string;
   private jwtHandler: express.RequestHandler;
   
   async handle(req: express.Request, res: express.Response) {
      if (!this.jwtHandler) return;
      await wrapPromise<void>(this.jwtHandler, req, res);
      if (req[this.property]) req[this.property] = await this.fromJson(req[this.property]);
   }
   
   protected async fromJson(json: any) {
      return json;
   }
}
