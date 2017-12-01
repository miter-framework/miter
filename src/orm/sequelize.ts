import { Injectable } from '../decorators/services/injectable.decorator';
import { Name } from '../decorators/services/name.decorator';
import { OrmMetadata } from '../metadata/server/orm';
import { DatabaseMetadata } from '../metadata/server/database';
import { Logger } from '../services/logger';
import { LoggerCore } from '../services/logger-core';
import { ClsNamespaceService } from '../services/cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { TransactionImpl } from './impl/transaction-impl';
import * as __Sequelize from 'sequelize';

@Injectable()
@Name('orm')
export class Sequelize {
    constructor(
        private ormMeta: OrmMetadata,
        private dbMeta: DatabaseMetadata,
        private loggerCore: LoggerCore,
        private logger: Logger,
        private namespace: ClsNamespaceService
    ) {
        this.sqlLogger = Logger.fromSubsystem(this.loggerCore, 'sql');
    }
    
    private sqlLogger: Logger;
    
    private _initialized = false;
    async init() {
        if (this._initialized) return;
        this._initialized = true;
        
        if (!this.ormMeta.enabled || !this.dbMeta) return;
        
        let db = this.dbMeta;
        this.sql = new __Sequelize(db.name, db.user, db.password, {
            host: db.host.domain,
            port: db.host.port,
            
            dialect: db.dialect,
            dialectOptions: {
                charset: db.charset
            },
            pool: db.pool,
            define: {
                charset: db.charset,
                collate: `${db.charset}_general_ci`
            },
            logging: (msg: string, ...extras: any[]) => this.sqlLogger.verbose(msg, ...extras)
        });
    }
    
    private sql: __Sequelize.Sequelize;
    
    async sync() {
        let recreate = (this.ormMeta.recreate) || false;
        if (recreate) {
            if ((<string>process.env.NODE_ENV || '') == 'production') throw new Error('Server launched with config value orm.recreate enabled. As a security feature, this causes a crash when NODE_ENV = production.');
            this.logger.warn(`Warning: recreating database tables. Note: this option should not be enabled in production.`);
        }
        
        if (!this.sql) throw new Error(`Cannot sync the database: the ORM is disabled.`);
        
        return await this.sql.sync({force: recreate});
    }
    
    define(modelName: string, attributes: __Sequelize.DefineAttributes, options: __Sequelize.DefineOptions<{}>) {
        if (!this.sql) throw new Error(`Cannot define new models: the ORM is disabled.`);
        
        return this.sql.define(modelName, attributes, options);
    }
    
    get currentTransaction(): TransactionT | undefined {
        return this.namespace.get('transaction');
    }
    set currentTransaction(val: TransactionT | undefined) {
        this.namespace.set('transaction', val);
    }
    
    async transaction(transactionName: string, transaction?: TransactionT | null): Promise<TransactionT | undefined> {
        let parentTransaction = transaction;
        if (typeof parentTransaction === 'undefined') parentTransaction = this.currentTransaction;
        if (!this.sql) return parentTransaction || undefined;
        
        let sqlTransact = parentTransaction && (<TransactionImpl>parentTransaction).sync();
        if (!sqlTransact) sqlTransact = await this.sql.transaction();
        else sqlTransact = await this.sql.transaction(<any>{ transaction: sqlTransact }); //Cast to any is cheating, because the typings are wrong
        
        let t = new TransactionImpl(transactionName, sqlTransact!, parentTransaction || null);
        this.currentTransaction = t;
        return t;
    }
}
