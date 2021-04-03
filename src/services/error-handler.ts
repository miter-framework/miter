import { Injectable } from '../decorators/services/injectable.decorator';
import { Request, Response } from 'express';

@Injectable()
export class ErrorHandler {
  constructor() { }

  async handleError(e: any) {
    return false;
  }
  async handleRouteError(e: any, req: Request, res: Response) {
    return false;
  }
  async handleNoRouteResponse(req: Request, res: Response) {
    return false;
  }
}
