import * as Sql from 'sequelize';
import { Transaction } from '../../core/transaction';

export class TransactionImpl implements Transaction {
    constructor(private sqlTransact: Sql.Transaction) {
        this._complete = false;
        this._transaction = sqlTransact;
    }
    
    get isComplete() {
        return this._complete;
    }
    
    private _complete: boolean;
    private _transaction: Sql.Transaction;
    
    async sync() {
        if (this.isComplete) {
            throw new Error(`Cannot sync a transaction that has completed!`);
        }
        return this._transaction;
    }
    
    async rollback() {
        let t = await this.sync();
        this._complete = true;
        await t.rollback();
    }
    async commit() {
        let t = await this.sync();
        this._complete = true;
        await t.commit();
    }
}
