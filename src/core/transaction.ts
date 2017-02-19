import * as Sql from 'sequelize';

export interface Transaction {
    isComplete: boolean;
    
    rollback(): Promise<void>;
    commit(): Promise<void>;
}
