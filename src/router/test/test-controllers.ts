import { Policy1, Policy2, Policy3 } from './test-policies';
import { PolicyDescriptor } from '../../core/policy';
import { Controller } from '../../decorators/router/controller.decorator';
import { Get } from '../../decorators/router/routes/get.decorator';
import { Post } from '../../decorators/router/routes/post.decorator';
import { Request, Response } from 'express';

@Controller()
export class EmptyController { }

export class ControllerSansDecorator { }

@Controller()
export class EmptyControllerChild { }
@Controller({ controllers: [EmptyControllerChild] })
export class EmptyControllerRoot { }

@Controller()
export class SimpleController {
    @Get('a') async a(req: Request, res: Response) { }
    @Get('b') async b(req: Request, res: Response) { }
    @Get('c') async c(req: Request, res: Response) { }
}
@Controller()
export class SimpleChildController extends SimpleController {
    @Get('x') async x(req: Request, res: Response) { }
    @Get('y') async y(req: Request, res: Response) { }
    @Get('z') async z(req: Request, res: Response) { }
}
@Controller({
    controllers: [SimpleController]
})
export class SimpleControllerRoot { }

@Controller()
export class MultiRouteController {
    @Get('a')
    @Get('b')
    @Post('x')
    async multi(req: Request, res: Response) { }
}

@Controller()
export class PhishingController {
    public someFakeFunction(...args: any[]) {}
    private anotherOne() {}
    masqueradingAsRoutes(name: string, age: number) {}
    async withTheSameSignature(req: Request, res: Response) {}
}

@Controller({
    path: 'api',
    policies: [Policy1]
})
export class ComplexController {
    @Get({
        path: 'x',
        policies: [Policy2]
    })
    async healthCheck(req: Request, res: Response) { }
    
    transformPathPart(routeFnName: string, part: string): string {
        return routeFnName + part.repeat(3);
    }
    transformPath(routeFnName: string, path: string): string {
        return path.toUpperCase();
    }
    transformRoutePolicies(routeFnName: string, fullPath: string, policies: PolicyDescriptor[]): PolicyDescriptor[] {
        return [Policy3, ...policies];
    }
}
