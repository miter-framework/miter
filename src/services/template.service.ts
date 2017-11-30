import { Service } from '../decorators/services/service.decorator';

export type Locals = { [prop: string]: any };

@Service()
export class TemplateService {
    constructor() { }
    
    async start() { }
    
    public renderRaw(body: string, locals?: Locals): Promise<string> {
        throw new Error(`You have no TemplateService selected, or it does not implement renderRaw.`);
    }
    public render(path: string, locals?: Locals): Promise<string> {
        throw new Error(`You have no TemplateService selected, or it does not implement render.`);
    }
}
