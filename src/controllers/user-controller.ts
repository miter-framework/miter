import { Controller, Get } from '../router/decorators';

function htmlBody(body: string, title?: string) {
   title = title || 'Title!';
   return `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;
}

@Controller({ })
export class UserController {
   
   @Get('/api/users/find')
   async find(req, res, next) {
      res.status(200).send(htmlBody(`Hello, World!`));
   }
   
}
