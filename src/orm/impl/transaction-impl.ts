import * as Sql from 'sequelize';
import { TransactionT } from '../../core/transaction';

export class TransactionImpl implements TransactionT {
    constructor(name: string, private sqlTransact: Sql.Transaction, private parentTransaction: TransactionT | null = null) {
        this._name = name;
        this._complete = false;
        this._transaction = sqlTransact;
    }
    
    private _name: string;
    get name(): string {
        return this._name;
    }
    get fullName(): string {
        if (!this.parentTransaction) return this.name;
        else return `${this.parentTransaction.fullName}.${this.name}`;
    }
    
    get isComplete() {
        return this._complete;
    }
    
    private _complete: boolean = false;
    private _transaction: Sql.Transaction;
    
    sync() {
        if (this.isComplete) {
            throw new Error(`Cannot sync a transaction that has completed!`);
        }
        return this._transaction;
    }
    
    async rollback() {
        let t = this.sync();
        this._complete = true;
        await t.rollback();
    }
    async commit() {
        let t = this.sync();
        this._complete = true;
        await t.commit();
    }
}
