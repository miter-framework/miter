import { Policy } from '../../decorators/policies/policy.decorator';
import { Request, Response } from 'express';

@Policy()
export class Policy1 {
  async handle(req: Request, res: Response) {
    return "one";
  }
}
@Policy()
export class Policy2 {
  async handle(req: Request, res: Response) {
    return "two";
  }
}
@Policy()
export class Policy3 {
  async handle(req: Request, res: Response) {
    return "three";
  }
}

@Policy()
export class UnusedPolicy {
  async handle(req: Request, res: Response) {
    return "unused";
  }
}

@Policy()
export class EarlyReturnPolicy {
  async handle(req: Request, res: Response) {
    res.status(123).send('Mwen fini!');
    return "early-return";
  }
}
@Policy()
export class ThrowPolicy {
  async handle(req: Request, res: Response): Promise<string> {
    throw new Error(`Haha, joke's on you!`);
  }
}
