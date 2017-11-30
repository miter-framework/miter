import { TransactionT } from '../../core/transaction';
import { Service } from '../../decorators/services/service.decorator';

@Service()
export class FakeTransactionService {
    constructor() {
    }
    
    async start() { }
    
    get current(): TransactionT | undefined {
        return undefined;
    }
    
    async run<T = void>(transactionName: string, fn: () => Promise<T>): Promise<T> {
        return await fn();
    }
}
