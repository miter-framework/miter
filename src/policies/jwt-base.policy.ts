import * as express from 'express';
import * as expressJwt from 'express-jwt';

import { Policy } from '../decorators/policies/policy.decorator';
import { Server } from '../server/server';
import { wrapPromise } from '../util/wrap-promise';

type AbstractCtorT<T> = { (...args: any[]): T };

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
    
    private get logger() {
        return this.server.logger;
    }
    
    async handle(req: express.Request, res: express.Response) {
        if (this.jwtHandler) {
            try {
                await wrapPromise<void>(this.jwtHandler, req, res);
            }
            catch (e) {
                this.logger.verbose('jwt-policy', `express-jwt failed to parse 'Authorization' header.`);
                this.logger.verbose('jwt-policy', `'Authorization' header: '${req.header('Authorization')}'`);
                (<any>req)[this.property] = undefined;
            }
        }
        if ((<any>req)[this.property]) return (<any>req)[this.property] = await this.fromJson((<any>req)[this.property]);
        return null;
    }
    
    protected async fromJson(json: any) {
        return json;
    }
}
