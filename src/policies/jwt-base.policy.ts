import { Request, Response, RequestHandler } from 'express';
import * as expressJwt from 'express-jwt';

import { Policy } from '../decorators/policies/policy.decorator';
import { JwtMetadata } from '../metadata/server/jwt';
import { Logger } from '../services/logger';
import { wrapPromise } from '../util/wrap-promise';

type AbstractCtorT<T> = { (...args: any[]): T };

@Policy()
export class JwtBasePolicy {
    constructor(
        private jwtMeta: JwtMetadata,
        protected readonly logger: Logger,
        credentialsRequired: boolean
    ) {
        if (!jwtMeta) return;
        
        this.jwtHandler = expressJwt({
            secret: jwtMeta.secret,
            userProperty: this.property,
            credentialsRequired: credentialsRequired
        });
    }
    
    get property() {
        return this.jwtMeta.tokenProperty;
    }
    private jwtHandler: RequestHandler;
    
    async handle(req: Request, res: Response) {
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
