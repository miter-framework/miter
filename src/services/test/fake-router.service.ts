import { Service } from '../../decorators/services/service.decorator';
import { Router as CoreRouter } from 'express-serve-static-core';
import { Router as ExpressRouter, IRouterMatcher } from 'express';

export class FakeExpressRouter {
    constructor() {
    }
    
    param(...args: any[]): this {
        return this;
    }

    all(...args: any[]) { return this; }
    get(...args: any[]) { return this; }
    post(...args: any[]) { return this; }
    put(...args: any[]) { return this; }
    delete(...args: any[]) { return this; }
    patch(...args: any[]) { return this; }
    options(...args: any[]) { return this; }
    head(...args: any[]) { return this; }

    checkout(...args: any[]) { return this; }
    copy(...args: any[]) { return this; }
    lock(...args: any[]) { return this; }
    merge(...args: any[]) { return this; }
    mkactivity(...args: any[]) { return this; }
    mkcol(...args: any[]) { return this; }
    move(...args: any[]) { return this; }
    "m-search"(...args: any[]) { return this; }
    notify(...args: any[]) { return this; }
    purge(...args: any[]) { return this; }
    report(...args: any[]) { return this; }
    search(...args: any[]) { return this; }
    subscribe(...args: any[]) { return this; }
    trace(...args: any[]) { return this; }
    unlock(...args: any[]) { return this; }
    unsubscribe(...args: any[]) { return this; }
}

@Service()
export class FakeRouterService {
    constructor() {
        this._router = <any>new FakeExpressRouter();
    }
    
    async start() { }
    
    private _router: CoreRouter;
    get expressRouter(): CoreRouter {
        return this._router;
    }
}
