import { Injector } from '../core/injector';
import { Service } from '../decorators/services/service.decorator';
import { Logger } from './logger';
import { ClsNamespaceService } from './cls-namespace.service';
import { TransactionT } from '../core/transaction';

@Service({
    provide: {
        useCallback: (logger: Logger) => {
            logger.error(`Failed to inject ORM service. There is no default implementation. Did you look into miter-sequelize?`);
            return null;
        },
        deps: [Logger],
        cache: true
    }
})
export class ORMService {
    constructor(
        private _injector: Injector,
        private _namespace: ClsNamespaceService
    ) { }
    
    protected get injector(): Injector {
        return this._injector;
    }
    
    protected get namespace(): ClsNamespaceService {
        return this._namespace;
    }
    
    async start() { }
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
