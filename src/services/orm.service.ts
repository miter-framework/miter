import { Injector } from '../core/injector';
import { Service } from '../decorators/services/service.decorator';
import { ClsNamespaceService } from './cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { TransactionService } from './transaction.service';

@Service()
export class ORMService {
    constructor(
        private _injector: Injector,
        private _namespace: ClsNamespaceService
    ) {
        if (this.constructor === ORMService) throw new Error(`Failed to start ORM service. There is no default implementation. Did you look into miter-sequelize?`);
    }
    
    protected get injector(): Injector {
        return this._injector;
    }
    
    protected get namespace(): ClsNamespaceService {
        return this._namespace;
    }
    
    private _transactionService: TransactionService;
    protected get transactionService() {
        return this._transactionService;
    }
    
    async start() {
        this._transactionService = this.injector.resolveInjectable(TransactionService)!;
    }
    async stop() { }
    
    get currentTransaction(): TransactionT | undefined {
        return this.namespace.get('transaction');
    }
    set currentTransaction(val: TransactionT | undefined) {
        this.namespace.set('transaction', val);
    }
    
    async transaction(transactionName: string, transaction?: TransactionT | null): Promise<TransactionT | undefined> {
        throw new Error(`ORMService.transaction has no default implementation.`);
    }
}
