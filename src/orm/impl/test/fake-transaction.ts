import { TransactionT } from '../../../core/transaction';

export class FakeTransaction implements TransactionT {
    constructor(name: string, private parentTransaction?: TransactionT) {
        this._name = name;
    }
    
    private _name: string;
    get name(): string {
        return this._name;
    }
    get fullName(): string {
        if (!this.parentTransaction) return this.name;
        else return `${this.parentTransaction.fullName}.${this.name}`;
    }
    
    private _complete: boolean = false;
    get isComplete() {
        return this._complete;
    }
    
    async rollback() {
        if (this.isComplete) throw new Error(`Cannot sync a transaction that has completed!`);
        this._complete = true;
    }
    async commit() {
        if (this.isComplete) throw new Error(`Cannot sync a transaction that has completed!`);
        this._complete = true;
    }
}
