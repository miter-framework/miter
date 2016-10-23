import * as express from 'express';
import { Controller, Get } from '../router/decorators';

function htmlBody(body: string, title?: string) {
   title = title || 'Title!';
   return `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;
}

@Controller({ })
export class TestController {
   
   @Get('/')
   index(req: express.Request, res: express.Response) {
      res.send(200, htmlBody(`Home! <a href='/about'>About Us</a>`));
   }
   
   @Get('/about')
   about(req: express.Request, res: express.Response) {
      res.send(200, htmlBody(`About us! <a href='/foobar'>Stuff</a>`));
   }
   
   @Get('/foobar')
   foobar(req: express.Request, res: express.Response) {
      res.send(200, htmlBody(`Foobar! <a href='/'>Go home</a>`));
   }
   
}
