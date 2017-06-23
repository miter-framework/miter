import { Request, Response, RequestHandler } from 'express';
import * as expressJwt from 'express-jwt';

import { Policy } from '../decorators/policies/policy.decorator';
import { JwtMetadata } from '../metadata/server/jwt';
import { Logger } from '../services/logger';
import { wrapPromise } from '../util/wrap-promise';
import { HTTP_STATUS_UNAUTHORIZED } from '../util/http-status-type';

type AbstractCtorT<T> = { (...args: any[]): T };

@Policy()
export class JwtBasePolicy {
    constructor(
        private jwtMeta: JwtMetadata,
        protected readonly logger: Logger,
        public credentialsRequired: boolean
    ) {
        if (!jwtMeta) return;
        
        this.jwtHandler = expressJwt({
            secret: jwtMeta.secret,
            userProperty: this.property,
            credentialsRequired: false
        });
    }
    
    get property() {
        if (!this.jwtMeta) return undefined;
        return this.jwtMeta.tokenProperty;
    }
    private jwtHandler: RequestHandler;
    
    async handle(req: Request, res: Response) {
        let jwt = await this.getJwt(req, res);
        let reqProperty = this.property!;
        if (jwt !== null) jwt = (<any>req)[reqProperty] = await this.fromJson(jwt);
        if (this.credentialsRequired && !jwt) {
            res.status(HTTP_STATUS_UNAUTHORIZED).json({ msg: 'Invalid Authorization header.' });
        }
        return jwt;
    }
    
    private async getJwt(req: Request, res: Response) {
        let reqProperty = this.property!
        if (this.jwtHandler) {
            try {
                await wrapPromise<void>(this.jwtHandler, req, res);
            }
            catch (e) {
                this.logger.verbose('jwt-policy', `express-jwt failed to parse 'Authorization' header.`);
                this.logger.verbose('jwt-policy', `'Authorization' header: '${req.header('Authorization')}'`);
            }
        }
        return (<any>req)[reqProperty] = (<any>req)[reqProperty] || null;
    }
    
    protected async fromJson(json: any) {
        return json;
    }
}
