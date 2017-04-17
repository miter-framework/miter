import { Request, Response, RequestHandler } from 'express';
import { Policy } from '../decorators/policies/policy.decorator';
import * as express from 'express';
import * as expressStatic from 'serve-static';
import { wrapPromise } from '../util/wrap-promise';

@Policy()
export class ServeStaticPolicy {
    constructor(root: string, options?: expressStatic.ServeStaticOptions) {
        this.middleware = express.static(root, options);
    }
    
    private middleware: RequestHandler;
    
    async handle(req: Request, res: Response) {
        console.log(`Attempting to serve static. path: ${req.path}`)
        return await wrapPromise(this.middleware, req, res);
    }
}

/*

@Controller()
@ServeStatic('.')
export class TestController {
    constructor() { }
    
    @Get('*')
    async doSomething(req: Request, res: Response) {
        res.status(404).send('Could not find the specified file.');
    }
}

*/
