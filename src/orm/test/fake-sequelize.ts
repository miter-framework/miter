import { StaticModelT, ModelT, PkType } from '../../core/model';
import { Sequelize } from '../sequelize';
import { Logger } from '../../services/logger';
import { ClsNamespaceService } from '../../services/cls-namespace.service';
import { TransactionT } from '../../core/transaction';
import { FakeTransaction } from '../impl/test/fake-transaction';
import * as __Sequelize from 'sequelize';

export class FakeSequelize extends Sequelize {
    constructor(logger: Logger, clsNamespace: ClsNamespaceService, ...models: StaticModelT<ModelT<any>>[]) {
        super(<any>{
            enabled: true,
            models: [...models],
            recreate: false
        }, logger, clsNamespace);
    }
    
    async init() { }
    
    async sync() { }
    
    define(modelName: string, attributes: __Sequelize.DefineAttributes, options: __Sequelize.DefineOptions<{}>): __Sequelize.Model<{}, {}> {
        throw new Error(`Invalid operation on FakeSequelize: I don't know how to define models!`);
    }
    
    async transaction(transactionName: string, transaction?: TransactionT): Promise<TransactionT> {
        let parentTransaction = transaction;
        if (typeof parentTransaction === 'undefined') parentTransaction = this.currentTransaction;
        let t = new FakeTransaction(transactionName, parentTransaction);
        this.currentTransaction = t;
        return t;
    }
}
