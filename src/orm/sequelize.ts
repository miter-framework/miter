import { Injectable } from '../decorators/services/injectable.decorator';
import { OrmMetadata } from '../metadata/server/orm';
import { Logger } from '../services/logger';
import { ClsNamespaceService } from '../services/cls-namespace.service';
import { TransactionT } from '../core/transaction';
import { TransactionImpl } from './impl/transaction-impl';
import * as __Sequelize from 'sequelize';

@Injectable()
export class Sequelize {
    constructor(
        private ormMeta: OrmMetadata,
        private logger: Logger,
        private namespace: ClsNamespaceService
    ) { }
    
    private _initialized = false;
    async init() {
        if (this._initialized) return;
        this._initialized = true;
        
        let orm = this.ormMeta;
        if (!orm.enabled || !orm.db) return;
        let db = orm.db;
        
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
            logging: (msg: string, ...extras: any[]) => this.logger.verbose('sql', msg, ...extras)
        });
    }
    
    private sql: __Sequelize.Sequelize;
    
    async sync() {
        let recreate = (this.ormMeta.recreate) || false;
        if (recreate) {
            if ((<string>process.env.NODE_ENV || '') == 'production') throw new Error('Server launched with config value orm.recreate enabled. As a security feature, this causes a crash when NODE_ENV = production.');
            this.logger.warn('orm', `Warning: recreating database tables. Note: this option should not be enabled in production.`);
        }
        return await this.sql.sync({force: recreate});
    }
    
    define(modelName: string, attributes: __Sequelize.DefineAttributes, options: __Sequelize.DefineOptions<{}>) {
        return this.sql.define(modelName, attributes, options);
    }
    
    get currentTransaction(): TransactionT | undefined {
        return this.namespace.get('transaction');
    }
    set currentTransaction(val: TransactionT | undefined) {
        this.namespace.set('transaction', val);
    }
    
    async transaction(transactionName: string, transaction?: TransactionT): Promise<TransactionT> {
        let parentTransaction = transaction || this.currentTransaction;
        let sqlTransact = parentTransaction && (<TransactionImpl>parentTransaction).sync();
        if (!sqlTransact) sqlTransact = await this.sql.transaction();
        else sqlTransact = await this.sql.transaction(<any>{ transaction: sqlTransact }); //Cast to any is cheating, because the typings are wrong
        
        let t = new TransactionImpl(transactionName, sqlTransact!, parentTransaction);
        this.currentTransaction = t;
        return t;
    }
}
