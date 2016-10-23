import { Controller, Get } from '../router/decorators';

function htmlBody(body: string, title?: string) {
   title = title || 'Title!';
   return `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;
}

@Controller({ })
export class UserController {
   
   @Get('/api/users/find')
   async find(req, res, next) {
      res.send(200, htmlBody(`Hello, World!`));
   }
   
}
