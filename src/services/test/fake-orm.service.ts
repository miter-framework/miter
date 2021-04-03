import { Injector } from '../../core/injector';
import { Injectable } from '../../decorators/services/injectable.decorator';
import { TransactionT } from '../../core/transaction';
import { ORMService } from '../orm.service';
import { ClsNamespaceService } from '../cls-namespace.service';
import { FakeTransaction } from './fake-transaction';

@Injectable()
export class FakeORMService extends ORMService {
  constructor(
    injector: Injector,
    namespace: ClsNamespaceService
  ) {
    super(injector, namespace);
  }

  async transaction(transactionName: string, transaction?: TransactionT): Promise<TransactionT> {
    let parentTransaction = transaction;
    if (typeof parentTransaction === 'undefined') parentTransaction = this.currentTransaction;
    let t = new FakeTransaction(transactionName, parentTransaction);
    this.currentTransaction = t;
    return t;
  }
}
