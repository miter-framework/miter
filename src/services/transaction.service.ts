import { ClsNamespaceService } from './cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { Service } from '../decorators/services/service.decorator';
import { Sequelize } from '../orm/sequelize';
import { Logger } from './logger';

@Service()
export class TransactionService {
    constructor(private sequelize: Sequelize, private logger: Logger, private namespace: ClsNamespaceService) {
    }
    
    get current(): TransactionT | undefined {
        return this.sequelize.currentTransaction;
    }
    
    async run<T = void>(transactionName: string, fn: () => Promise<T>): Promise<T> {
        return await this.namespace.runAndReturn(async () => {
            let t = await this.sequelize.transaction(transactionName, this.current);
            this.logger.verbose('transactions', `creating transaction (${t.fullName})`);
            let failed = false;
            try {
                return await fn();
            }
            catch (e) {
                this.logger.error('transactions', `caught an exception in a transaction (${t.fullName}). Rolling back...`);
                this.logger.verbose('transactions', 'exception details:', e);
                if (t) {
                    if (t.isComplete) this.logger.warn('transactions', `transaction (${t.fullName}) committed or rolled back inside transaction function. Cannot roll back.`);
                    else await t.rollback();
                }
                failed = true;
                throw e;
            }
            finally {
                if (!failed) {
                    this.logger.verbose('transactions', `committing transaction (${t.fullName})`);
                    if (t) {
                        if (t.isComplete) this.logger.warn('transactions', `transaction (${t.fullName}) committed or rolled back inside transaction function. Cannot commit.`);
                        else await t.commit();
                    }
                }
            }
        });
    }
}
