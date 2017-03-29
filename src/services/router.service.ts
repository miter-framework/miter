import { Service } from '../decorators/services/service.decorator';
import { Router as CoreRouter } from 'express-serve-static-core';
import { Router as ExpressRouter } from 'express';

@Service()
export class RouterService /*implements CoreRouter*/ {
    constructor() {
        this._router = ExpressRouter();
    }
    
    private _router: CoreRouter;
    get expressRouter() {
        return this._router;
    }
}
