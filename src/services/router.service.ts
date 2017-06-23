import { Service } from '../decorators/services/service.decorator';
import { Router as CoreRouter } from 'express-serve-static-core';
import { Router as ExpressRouter } from 'express';

//Note: This is a very thin wrapper for the ExpressRouter.
//      The purpose is to allow the express router to be injected into any other services that may need it
//      (without having to inject the entire server.)
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
