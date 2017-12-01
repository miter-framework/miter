import { ClsNamespaceService } from './cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { Service } from '../decorators/services/service.decorator';
import { Name } from '../decorators/services/name.decorator';
import { Sequelize } from '../orm/sequelize';
import { Logger } from './logger';

@Service()
@Name('transactions')
export class TransactionService {
    constructor(private sequelize: Sequelize, private logger: Logger, private namespace: ClsNamespaceService) {
    }
    
    async start() { }
    
    get current(): TransactionT | undefined {
        return this.sequelize.currentTransaction;
    }
    
    run<T = void>(transactionName: string, fn: () => Promise<T>): Promise<T>;
    run<T = void>(transactionName: string, detach: boolean, fn: () => Promise<T>): Promise<T>
    async run<T = void>(transactionName: string, detach: boolean | (() => Promise<T>), fn?: () => Promise<T>): Promise<T> {
        if (typeof detach === 'function') {
            fn = detach;
            detach = false;
        }
        return await this.namespace.runAndReturn(async () => {
            let t = await this.sequelize.transaction(transactionName, detach ? null : this.current);
            if (!t) return await fn!();
            
            this.logger.verbose(`creating transaction (${t.fullName})`);
            let failed = false;
            try {
                return await fn!();
            }
            catch (e) {
                this.logger.error(`caught an exception in a transaction (${t.fullName}). Rolling back...`);
                this.logger.verbose('exception details:', e);
                if (t) {
                    if (t.isComplete) this.logger.warn(`transaction (${t.fullName}) committed or rolled back inside transaction function. Cannot roll back.`);
                    else await t.rollback();
                }
                failed = true;
                throw e;
            }
            finally {
                if (!failed) {
                    this.logger.verbose(`committing transaction (${t.fullName})`);
                    if (t) {
                        if (t.isComplete) this.logger.warn(`transaction (${t.fullName}) committed or rolled back inside transaction function. Cannot commit.`);
                        else await t.commit();
                    }
                }
            }
        });
    }
}
