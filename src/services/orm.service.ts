import { Service } from '../decorators/services/service.decorator';
import { TransactionT } from '../core/transaction';

@Service()
export class ORMService {
    constructor() {
        if (this.constructor === ORMService) throw new Error(`Failed to start ORM service. There is no default implementation. Did you look into miter-sequelize?`);
    }
    
    currentTransaction: TransactionT | undefined;
    
    async transaction(transactionName: string, transaction?: TransactionT | null): Promise<TransactionT | undefined> {
        throw new Error(`ORMService.transaction has no default implementation.`);
    }
}
