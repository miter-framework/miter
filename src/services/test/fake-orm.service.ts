import { TransactionT } from '../../core/transaction';
import { ORMService } from '../orm.service';
import { ClsNamespaceService } from '../cls-namespace.service';
import { FakeTransaction } from './fake-transaction';

export class FakeORMService extends ORMService {
    constructor(
        namespace: ClsNamespaceService
    ) {
        super(namespace);
    }
    
    async transaction(transactionName: string, transaction?: TransactionT): Promise<TransactionT> {
        let parentTransaction = transaction;
        if (typeof parentTransaction === 'undefined') parentTransaction = this.currentTransaction;
        let t = new FakeTransaction(transactionName, parentTransaction);
        this.currentTransaction = t;
        return t;
    }
}
