

export interface TransactionT {
    readonly name: string;
    readonly fullName: string;
    
    isComplete: boolean;
    
    rollback(): Promise<void>;
    commit(): Promise<void>;
}
