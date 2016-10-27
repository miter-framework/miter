import * as express from 'express';
import { Controller, Get } from './decorators';
import { AuthService } from '../services/auth.service';
import { EvenIdPolicy } from '../policies/even-id.policy';

function htmlBody(body: string, title?: string) {
   title = title || 'Title!';
   return `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;
}

@Controller({ })
export class UserController {
   constructor(private authService: AuthService) {
   }
   
   @Get('/api/users/find')
   async find(req: express.Request, res: express.Response) {
      res.status(200).send(htmlBody(`Hello, World! This is the meaning of life, the universe, and everything: ${this.authService.meaningOfLife()}`));
   }
}
