import * as Sql from 'sequelize';

export interface TransactionT {
    isComplete: boolean;
    
    rollback(): Promise<void>;
    commit(): Promise<void>;
}
