import { Miter, Controller, Get, Request, Response } from 'miter';

@Controller()
export class HomeController {
    constructor() { }
    
    @Get('')
    public async home(req: Request, res: Response) {
        res.status(200).send('Simple Server Homepage.');
    }
}

Miter.launch({
    name: 'simple-server',
    port: 8080,
    router: {
        controllers: [<any>HomeController]
    }
});
