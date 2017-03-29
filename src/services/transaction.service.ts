import { ClsNamespaceService } from './cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { Service } from '../decorators/services/service.decorator';
import { OrmReflector } from '../orm/reflector';
import { Logger } from './logger';

@Service()
export class TransactionService {
    constructor(private ormReflector: OrmReflector, private logger: Logger, private namespace: ClsNamespaceService) {
    }
    
    get current(): TransactionT | undefined {
        return this.namespace.get('transaction');
    }
    
    async run(fn: () => Promise<void>): Promise<void>;
    async run<T>(fn: () => Promise<T>): Promise<T> {
        return await this.namespace.runAndReturn(async () => {
            this.logger.verbose('transactions', `creating transaction`);
            let t = await this.ormReflector.transaction(this.current);
            this.namespace.set('transaction', t);
            let failed = false;
            try {
                return await fn();
            }
            catch (e) {
                this.logger.error('transactions', `caught an exception in a transaction. Rolling back...`);
                this.logger.verbose('transactions', 'exception details:', e);
                if (t) {
                    if (t.isComplete) this.logger.warn('transactions', `transaction committed or rolled back inside transaction function. Cannot roll back.`);
                    else await t.rollback();
                }
                failed = true;
                throw e;
            }
            finally {
                if (!failed) {
                    this.logger.verbose('transactions', `committing transaction`);
                    if (t) {
                        if (t.isComplete) this.logger.warn('transactions', `transaction committed or rolled back inside transaction function. Cannot commit.`);
                        else await t.commit();
                    }
                }
            }
        });
    }
}
