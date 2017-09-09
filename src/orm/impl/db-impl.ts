import * as Sql from 'sequelize';
import * as _ from 'lodash';

import { StaticModelT, ModelT, PkType, Db } from '../../core/model';
import { QueryT, FindOrCreateQueryT, CountQueryT, DestroyQueryT, CountAllResults } from '../../core/db';
import { CtorT } from '../../core/ctor';
import { TransactionT } from '../../core/transaction';

import { Transaction } from '../../decorators/orm/transaction.decorator';
import { Name } from '../../decorators/services/name.decorator';

import { PropMetadata, PropMetadataSym } from '../../metadata/orm/prop';
import { ModelPropertiesSym } from '../../metadata/orm/model';
import { ForeignModelSource } from '../../metadata/orm/associations/association';
import { ModelBelongsToAssociationsSym, BelongsToMetadataSym, BelongsToMetadata } from '../../metadata/orm/associations/belongs-to';
import { ModelHasOneAssociationsSym, HasOneMetadataSym, HasOneMetadata } from '../../metadata/orm/associations/has-one';
import { ModelHasManyAssociationsSym, HasManyMetadataSym, HasManyMetadata } from '../../metadata/orm/associations/has-many';

import { Types } from '../../decorators/orm';
import { Logger } from '../../services/logger';
import { Sequelize } from '../sequelize';
import { TransactionService } from '../../services/transaction.service';

import { TransactionImpl } from './transaction-impl';

type CopyValMeta = {
    columnName: string,
    propertyName: string,
    transformFn: { (val: any): any }
};
type BelongsToTransformMeta = {
    type: 'belongs-to';
    columnName: string;
    fieldName: string;
    foreignPkName: string;
    foreignDb: { (): DbImpl<ModelT<any>, any, any> };
}
type HasOneTransformMeta = {
    type: 'has-one';
    foreignColumnName: string;
    fieldName: string;
    pkName: string;
    foreignDb: { (): DbImpl<ModelT<any>, any, any> };
}
type HasManyTransformMeta = {
    type: 'has-many';
    foreignColumnName: string;
    fieldName: string;
    pkName: string;
    foreignDb: { (): DbImpl<ModelT<any>, any, any> };
}
type TransformValMeta = BelongsToTransformMeta | HasOneTransformMeta | HasManyTransformMeta;

type TransformedInclude = { model: any, as: string, include?: TransformedInclude[] };

@Name('db-impl')
export class DbImpl<T extends ModelT<PkType>, TInstance, TAttributes> implements Db<T> {
    constructor(
        private modelFn: StaticModelT<T>,
        private model: Sql.Model<TInstance, TAttributes>,
        private sequelize: Sequelize,
        private logger: Logger,
        private transactionService: TransactionService
    ) {
        this.createCopyValsFn();
        this.createTransformQuery();
    }
    
    private getSqlTransact(transaction?: TransactionT) {
        transaction = transaction || this.transactionService.current;
        if (transaction) this.logger.verbose(`Using transaction: ${transaction.fullName}`);
        return transaction && (<TransactionImpl>transaction).sync();
    }
    
    private async transaction(name: string, transaction?: TransactionImpl): Promise<TransactionImpl> {
        return <TransactionImpl>await this.sequelize.transaction(name, transaction);
    }
    
    async create(t: Object | T | Object[] | T[], transaction?: TransactionImpl): Promise<any> {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (t instanceof Array) {
            t = _.cloneDeep(t);
            (<Object[]>t).forEach((t, idx, arr) => {
                [arr[idx], implicitIncludes] = this.transformQueryWhere(t);
                if (implicitIncludes.length) throw new Error(`Cannot have implicit includes in where clause in create query.`);
            });
            let results = await this.model.bulkCreate(<any>t, _.merge({}, { transaction: sqlTransact }));
            // return this.wrapResults(results, implicitIncludes);
            return true;
        }
        else {
            [t, implicitIncludes] = this.transformQueryWhere(t);
            if (implicitIncludes.length) throw new Error(`Cannot have implicit includes in where clause in create query.`);
            let result = await this.model.create(<any>t, _.merge({}, { transaction: sqlTransact }));
            return this.wrapResult(result, implicitIncludes);
        }
    }
    
    async findById(id: string | number, options?: QueryT, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (options) [options, implicitIncludes] = this.transformQuery(options);
        if (options && typeof (<any>options).limit !== 'undefined') throw new Error(`Cannot include limit in findById query.`);
        let result = await this.model.findById(id, _.merge({}, { transaction: sqlTransact }, options));
        return result && this.wrapResult(result, implicitIncludes);
    }
    async findOne(query: QueryT, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        [query, implicitIncludes] = this.transformQuery(query);
        
        let limit = query && (<any>query).limit;
        if (implicitIncludes.length) {
            let results = await this.model.findAll(_.merge({}, { transaction: sqlTransact }, query));
            let result = results[0] || null;
            return result && this.wrapResult(result, implicitIncludes);
        }
        else {
            let result = await this.model.findOne(_.merge({}, { transaction: sqlTransact }, query));
            return result && this.wrapResult(result, implicitIncludes);
        }
    }
    async findOrCreate(query: Sql.WhereOptions, defaults?: Object | T, transaction?: TransactionImpl): Promise<[T, boolean]> {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        [query, implicitIncludes] = this.transformQueryWhere(query);
        let defaultImplicitIncludes: string[] = [];
        [defaults, defaultImplicitIncludes] = this.transformQueryWhere(defaults);
        if (defaultImplicitIncludes.length) {
            this.logger.error(`findOrCreate. query:`, query);
            this.logger.error(`defaults:`, defaults);
            this.logger.error(`defaultImplicitIncludes:`, defaultImplicitIncludes);
            throw new Error(`Cannot have implicit includes in default values in findOrCreate query.`);
        }
        
        let findOrCreateOpts = _.merge({}, {
            where: query,
            include: implicitIncludes,
            defaults: <any>defaults || {},
            transaction: sqlTransact
        });
        let [result, created] = await this.model.findOrCreate(findOrCreateOpts);
        return [result && this.wrapResult(result, implicitIncludes), created];
    }
    async findAndCountAll(query?: QueryT, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (query) [query, implicitIncludes] = this.transformQuery(query);
        
        let limitAfter = false;
        let limit = query && (<any>query).limit;
        if (implicitIncludes.length && limit) {
            limitAfter = true;
            delete (<any>query).limit;
        }
        
        let results = await this.model.findAndCountAll(_.merge({}, { transaction: sqlTransact }, query));
        
        if (limitAfter) results.rows = results.rows.slice(0, limit);
        
        return {
            count: results.count,
            results: this.wrapResults(results.rows, implicitIncludes)
        };
    }
    async findAll(query?: QueryT, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (query) [query, implicitIncludes] = this.transformQuery(query);
        
        let limitAfter = false;
        let limit = query && (<any>query).limit;
        if (implicitIncludes.length && limit) {
            limitAfter = true;
            delete (<any>query).limit;
        }
        
        let results = await this.model.findAll(_.merge({}, { transaction: sqlTransact }, query));
        
        if (limitAfter) results = results.slice(0, limit);
        
        return this.wrapResults(results, implicitIncludes);
    }
    async all(query?: QueryT, transaction?: TransactionImpl) {
        return await this.findAll(query, transaction);
    }
    async count(query?: CountQueryT, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (query) [query, implicitIncludes] = this.transformQuery(query);
        return await this.model.count(_.merge({}, { transaction: sqlTransact }, query));
    }
    
    async max(field: string, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        return await this.model.max(field, _.merge({}, { transaction: sqlTransact }));
    }
    async min(field: string, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        return await this.model.min(field, _.merge({}, { transaction: sqlTransact }));
    }
    async sum(field: string, transaction?: TransactionImpl) {
        let sqlTransact = this.getSqlTransact(transaction);
        return await this.model.sum(field, _.merge({}, { transaction: sqlTransact }));
    }
    
    async save(t: T, transaction?: TransactionImpl) {
        let result: T;
        let _: any;
        if (!t.id) result = await this.create(t, transaction);
        else [_, result] = await this.update(t.id, t, true, transaction);
        return result;
    }
    
    async update(query: number | string | T | QueryT, replace: Object, returning: boolean = false, transaction?: TransactionImpl): Promise<[boolean | number, any]> {
        if (!query) {
            throw new Error(`Db.update query parameter was falsey: ${query}`);
        }
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (this.isId(query)) query = { where: { id: query } };
        else if (this.isT(query)) query = { where: { id: query.id } };
        else {
            let include = (<any>query).include;
            if (include && include.length && !returning) throw new Error(`Cannot have explicit includes in update when returning = false.`);
            [query, implicitIncludes] = this.transformQuery(query);
            let limit = query && (<any>query).limit;
            let filterAfter = false;
            if (implicitIncludes && implicitIncludes.length && limit) {
                filterAfter = true;
                delete (<any>query).limit;
            }
            if (returning || filterAfter) {
                let results = await this.model.findAll(<QueryT>query);
                if (filterAfter) results = results.slice(0, limit);
                let ids = results.map((result) => (<any>result).id);
                query = { where: { id: { $in: ids } } };
            }
        }
        
        let replaceImplicitIncludes: string[] = [];
        [replace, replaceImplicitIncludes] = this.transformQueryWhere(replace);
        if (replaceImplicitIncludes.length) {
            this.logger.error(`update. query:`, query);
            this.logger.error(`replace:`, replace);
            this.logger.error(`replaceImplicitIncludes:`, replaceImplicitIncludes);
            throw new Error(`Cannot have implicit includes in replace values in update query.`);
        }
        
        let [affected, results]: [number, any[]] = await this.model.update(<any>replace, _.merge({}, { transaction: sqlTransact }, <any>query));
        
        if (returning) {
            let returningResults = await this.model.findAll(_.merge({}, { transaction: sqlTransact }, <QueryT>query));
            results = this.wrapResults(returningResults, implicitIncludes);
        }
        return [affected, results];
    }
    @Transaction()
    async updateOrCreate(query: Sql.WhereOptions, defaults: Object | T, transaction?: TransactionImpl): Promise<[T, boolean]> {
        let [result, created] = await this.findOrCreate(query, defaults);
        if (!created) {
            let worked = await this.update({ where: query }, defaults, false);
            if (!worked) throw new Error("Failed to update or create a model.");
            let resultOrNull = await this.findOne(_.merge({}, { where: query }, defaults));
            if (!resultOrNull) throw new Error("Updated row, but could not find it afterwards.");
            result = resultOrNull;
        }
        return [result, created];
    }
    
    async destroy(query: number | string | T | DestroyQueryT, transaction?: TransactionImpl): Promise<any> {
        let sqlTransact = this.getSqlTransact(transaction);
        let implicitIncludes: string[] = [];
        if (this.isId(query)) query = { where: { id: query } };
        else if (this.isT(query)) query = { where: { id: query.id } };
        else [query, implicitIncludes] = this.transformQuery(query);
        if (implicitIncludes.length && query && (<any>query).limit) throw new Error(`Model.destroy with limit and with a query containing implicit includes is not implemented`);
        return await this.model.destroy(_.merge({}, { transaction: sqlTransact }, query));
    }
    
    private isId(query: any): query is (number | string) {
        return typeof query === 'number' || typeof query == 'string';
    }
    private isT(query: T | QueryT): query is T {
        return !!(<T>query).id;
    }
    
    private copyVals: { (sql: TInstance, t: T): void };
    private createCopyValsFn() {
        let allProps: CopyValMeta[] = [];
        let directTransformFn = <T>(val: T) => val;
        
        let props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, this.modelFn.prototype) || [];
        for (let q = 0; q < props.length; q++) {
            let propName: string = props[q];
            let propMeta: PropMetadata = Reflect.getOwnMetadata(PropMetadataSym, this.modelFn.prototype, propName);
            if (!propMeta) throw new Error(`Could not find model property metadata for property ${this.modelFn.name || this.modelFn}.${propName}.`);
            
            let transformFn: { (val: any): any } = directTransformFn;
            if (propMeta.type == Types.DATE) transformFn = (dateStr) => new Date(dateStr);
            allProps.push({columnName: propMeta.columnName || propName, propertyName: propName, transformFn: transformFn});
        }
        
        // logger.log(this.modelFn.name || this.modelFn, 'allProps:', `[\r\n    ${allProps.map(p => p.propertyName + ': ' + p.columnName).join(',\r\n    ')}\r\n]`);
        
        this.copyVals = function(sql: TInstance, t: any) {
            for (let q = 0; q < allProps.length; q++) {
                // logger.log(allProps[q].propertyName + ':', sql[allProps[q].propertyName]);
                // t[allProps[q].propertyName] = allProps[q].transformFn(sql[allProps[q].columnName]);
                let propName = allProps[q].propertyName;
                t[propName] = allProps[q].transformFn((<any>sql)[propName]);
            }
            // logger.log(JSON.stringify(sql));
        }
    }
    
    private static getForeignModelDbImpl(foreignModel: ForeignModelSource | undefined) {
        if (!foreignModel || !("db" in foreignModel)) throw new Error("Cannot get DbImpl from ForeignModel that has not been resolved");
        
        let staticModel = <StaticModelT<ModelT<any>>>foreignModel;
        return <DbImpl<ModelT<any>, any, any>>staticModel.db;
    }
    
    private transformQueryWhere: { <T>(query: T, implicitIncludes?: string[], prefix?: string): [T, string[]] };
    private transformQueryInclude: { (aliases: string[]): any };
    private transformResult: { <T>(sql: TInstance, result: T, implicitIncludes?: string[]): T };
    private includeFields: string[];
    
    private createTransformQuery() {
        let transforms = this.transforms = this.getTransforms();
        this.createTransformQueryWhere(transforms);
        this.createTransformQueryInclude();
        this.createTransformResult(transforms);
    }
    
    private transformQuery(query: any): [any, string[]] {
        let result = _.clone(query);
        let implicitIncludes: string[] = [];
        if (query.where) [result.where, implicitIncludes] = this.transformQueryWhere(query.where, implicitIncludes);
        
        if (!query.include) query.include = [];
        for (let q = 0; q < query.include.length; q++) {
            let alias = query.include[q];
            let idx = implicitIncludes.indexOf(alias);
            if (idx !== -1) implicitIncludes.splice(idx, 1);
        }
        let include = [...query.include, ...implicitIncludes];
        result.include = this.transformQueryInclude(include);
        
        return [result, implicitIncludes];
    }
    
    private transforms: TransformValMeta[] = [];
    private getTransforms() {
        let transforms: TransformValMeta[] = [];
        
        let belongsTo: string[] = Reflect.getOwnMetadata(ModelBelongsToAssociationsSym, this.modelFn.prototype) || [];
        for (let q = 0; q < belongsTo.length; q++) {
            let propName: string = belongsTo[q];
            let propMeta: BelongsToMetadata = Reflect.getOwnMetadata(BelongsToMetadataSym, this.modelFn.prototype, propName);
            if (!propMeta) throw new Error(`Could not find model belongs-to metadata for property ${this.modelFn.name || this.modelFn}.${propName}.`);
            
            let fkey = propMeta.foreignKey;
            if (fkey && typeof fkey !== 'string') fkey = fkey.name;
            if (!fkey) throw new Error(`Could not get foreign key for belongs-to property ${this.modelFn.name || this.modelFn}.${propName}`);
            transforms.push({
                type: 'belongs-to',
                columnName: <string>fkey,
                fieldName: propName,
                foreignPkName: 'id', // propMeta.targetKey || 'id'
                foreignDb: () => DbImpl.getForeignModelDbImpl(propMeta.foreignModel) //Has to be lazy to avoid race conditions
            });
        }
        
        let hasOne: string[] = Reflect.getOwnMetadata(ModelHasOneAssociationsSym, this.modelFn.prototype) || [];
        for (let q = 0; q < hasOne.length; q++) {
            let propName: string = hasOne[q];
            let propMeta: HasOneMetadata = Reflect.getOwnMetadata(HasOneMetadataSym, this.modelFn.prototype, propName);
            if (!propMeta) throw new Error(`Could not find model has-one metadata for property ${this.modelFn.name || this.modelFn}.${propName}.`);
            
            let fkey = propMeta.foreignKey;
            if (fkey && typeof fkey !== 'string') fkey = fkey.name;
            if (!fkey) throw new Error(`Could not get foreign key for has-one property ${this.modelFn.name || this.modelFn}.${propName}`);
            transforms.push({
                type: 'has-one',
                foreignColumnName: <string>fkey,
                fieldName: propName,
                pkName: 'id',
                foreignDb: () => DbImpl.getForeignModelDbImpl(propMeta.foreignModel) //Has to be lazy to avoid race conditions
            });
        }
        
        let hasMany: string[] = Reflect.getOwnMetadata(ModelHasManyAssociationsSym, this.modelFn.prototype) || [];
        for (let q = 0; q < hasMany.length; q++) {
            let propName: string = hasMany[q];
            let propMeta: HasManyMetadata = Reflect.getOwnMetadata(HasManyMetadataSym, this.modelFn.prototype, propName);
            if (!propMeta) throw new Error(`Could not find model has-many metadata for property ${this.modelFn.name || this.modelFn}.${propName}.`);
            
            let fkey = propMeta.foreignKey;
            if (fkey && typeof fkey !== 'string') fkey = fkey.name;
            if (!fkey) throw new Error(`Could not get foreign key for has-many property ${this.modelFn.name || this.modelFn}.${propName}`);
            transforms.push({
                type: 'has-many',
                foreignColumnName: <string>fkey,
                fieldName: propName,
                pkName: 'id',
                foreignDb: () => DbImpl.getForeignModelDbImpl(propMeta.foreignModel) //Has to be lazy to avoid race conditions
            });
        }
        
        return transforms;
    }
    
    private composeAnd(query: any, $and: any) {
        if (!query) throw new Error(`Cannot compose $and. Invalid query: ${query}.`);
        if (Array.isArray(query)) query.push({ $and: $and });
        else if (!query.$and) query.$and = $and;
        else query.$and = [query.$and, $and];
    }
    private addPrefix(query: any, prefix: string) {
        if (!query) throw new Error(`Cannot add prefix to query. Invalid query: ${query}.`);
        let newQuery: any = {};
        for (let key in query) {
            if (key === '$and' || key === '$or') newQuery[key] = query[key];
            else newQuery[`$${prefix}.${key}$`] = query[key];
        }
        return newQuery;
    }
    
    private createTransformQueryWhere(transforms: TransformValMeta[]) {
        this.transformQueryWhere = (function<U>(this: DbImpl<T, TInstance, TAttributes>, query: U, implicitIncludes: string[] = [], prefix = ''): [U, string[]] {
            if (!query) return [query, implicitIncludes];
            query = _.clone(query);
            if ((<any>query)['$and']) {
                let andVal = (<any>query)['$and'];
                if (Array.isArray(andVal)) {
                    for (let q = 0; q < andVal.length; q++) {
                        if (typeof andVal[q] !== 'object') throw new Error(`Invalid $and query: [..., ${andVal[q]}, ...]`);
                        [andVal[q], implicitIncludes] = this.transformQueryWhere(andVal[q], implicitIncludes, prefix);
                    }
                }
                else if (typeof andVal === 'object') [andVal, implicitIncludes] = this.transformQueryWhere(andVal, implicitIncludes, prefix);
                else throw new Error(`Invalid $and query: ${andVal}`);
                (<any>query)['$and'] = andVal;
            }
            if ((<any>query)['$or']) {
                let orVal = (<any>query)['$or'];
                if (Array.isArray(orVal)) {
                    for (let q = 0; q < orVal.length; q++) {
                        if (typeof orVal[q] !== 'object') throw new Error(`Invalid $or query: [..., ${orVal[q]}, ...]`);
                        [orVal[q], implicitIncludes] = this.transformQueryWhere(orVal[q], implicitIncludes, prefix);
                    }
                }
                else if (typeof orVal === 'object') [orVal, implicitIncludes] = this.transformQueryWhere(orVal, implicitIncludes, prefix);
                else throw new Error(`Invalid $or query: ${orVal}`);
                (<any>query)['$or'] = orVal;
            }
            for (let q = 0; q < transforms.length; q++) {
                let transform = transforms[q];
                let fieldVal: any = (<any>query)[transform.fieldName];
                let transformedPrefix = (prefix ? `${prefix}.` : '') + transform.fieldName;
                switch (transform.type) {
                case 'belongs-to':
                    if (typeof fieldVal !== 'undefined') {
                        if (fieldVal && fieldVal[transform.foreignPkName]) fieldVal = fieldVal[transform.foreignPkName];
                        if (fieldVal === null || typeof fieldVal === 'string' || typeof fieldVal === 'number') {
                            (<any>query)[transform.columnName] = fieldVal;
                            delete (<any>query)[transform.fieldName];
                        }
                        else {
                            if (implicitIncludes.indexOf(transformedPrefix) === -1) implicitIncludes.push(transformedPrefix);
                            let foreignDb = transform.foreignDb();
                            let $and: any;
                            [$and, implicitIncludes] = foreignDb.transformQueryWhere(fieldVal, implicitIncludes, transformedPrefix);
                            delete (<any>query)[transform.fieldName];
                            this.composeAnd(query, $and);
                        }
                    }
                    break;
                case 'has-one':
                    if (typeof fieldVal !== 'undefined') {
                        if (implicitIncludes.indexOf(transformedPrefix) === -1) implicitIncludes.push(transformedPrefix);
                        let foreignDb = transform.foreignDb();
                        let $and: any;
                        [$and, implicitIncludes] = foreignDb.transformQueryWhere(fieldVal, implicitIncludes, transformedPrefix);
                        delete (<any>query)[transform.fieldName];
                        this.composeAnd(query, $and);
                    }
                    break;
                case 'has-many':
                    if (typeof fieldVal !== 'undefined') {
                        if (implicitIncludes.indexOf(transformedPrefix) === -1) implicitIncludes.push(transformedPrefix);
                        let foreignDb = transform.foreignDb();
                        let $and: any;
                        [$and, implicitIncludes] = foreignDb.transformQueryWhere(fieldVal, implicitIncludes, transformedPrefix);
                        delete (<any>query)[transform.fieldName];
                        this.composeAnd(query, $and);
                    }
                    break;
                default:
                    throw new Error(`WTF? How did you get here?`);
                }
            }
            let transformed = prefix ? this.addPrefix(query, prefix) : query;
            return [transformed, implicitIncludes];
        }).bind(this);
    }
    
    private createTransformQueryInclude() {
        function getForeignDb(impl: DbImpl<any, any, any>, field: string) {
            for (let i = 0; i < impl.transforms.length; i++) {
                if (field == impl.transforms[i].fieldName)
                    return impl.transforms[i].foreignDb();
            }
            return null;
        }
        
        this.transformQueryInclude = (function(this: DbImpl<any, any, any>, fields: string[]): any {
            if (!fields) return fields;
            let newFieldMap = new Map<string, [DbImpl<any, any, any>, TransformedInclude]>();
            let newFields: TransformedInclude[] = [];
            
            let self = this;
            function addInclude(field: string): [DbImpl<any, any, any>, TransformedInclude] {
                if (newFieldMap.has(field)) return newFieldMap.get(field)!;
                let lastIdx = field.lastIndexOf('.');
                if (lastIdx === -1) {
                    let fdb = getForeignDb(self, field);
                    if (!fdb) {
                        self.logger.error('fields:', fields);
                        self.logger.error('newFieldMap:', newFieldMap);
                        self.logger.error('newFields:', newFields);
                        throw new Error(`Cannot find field ${field} from include query`);
                    }
                    let val: TransformedInclude = { model: fdb.model, as: field };
                    newFields.push(val);
                    newFieldMap.set(field, [fdb, val]);
                    return [fdb, val];
                }
                else {
                    let assocName = field.substr(lastIdx + 1);
                    let prevName = field.substr(0, lastIdx);
                    let [prevDb, prevInclude] = addInclude(prevName);
                    let fdb = getForeignDb(prevDb, assocName);
                    if (!fdb) {
                        self.logger.error('fields:', fields);
                        self.logger.error('newFieldMap:', newFieldMap);
                        self.logger.error('newFields:', newFields);
                        throw new Error(`Cannot find field ${field} from include query`);
                    }
                    let val: TransformedInclude = { model: fdb.model, as: assocName };
                    if (!prevInclude.include) prevInclude.include = [val];
                    else prevInclude.include.push(val);
                    newFieldMap.set(field, [fdb, val]);
                    return [fdb, val];
                }
            }
            
            fields.forEach(addInclude);
            
            return newFields;
        }).bind(this);
    }
    
    private createTransformResult(transforms: TransformValMeta[]) {
        this.transformResult = (function<T>(sql: TInstance, result: T, implicitIncludes: string[] = []): T {
            if (result === null) return result;
            else if (typeof result === 'undefined') throw new Error(`Result was undefined in DbImpl#transformResult!`);
            result = _.clone(result);
            for (let q = 0; q < transforms.length; q++) {
                let transform = transforms[q];
                let foreignDb = transform.foreignDb();
                let fieldVal = (<any>sql)[transform.fieldName];
                switch (transform.type) {
                case 'belongs-to':
                    if (typeof fieldVal !== 'undefined') {
                        let t: ModelT<any> | null = null;
                        if (fieldVal) {
                            //TODO: include implicitIncludes
                            t = foreignDb.wrapResult(fieldVal, []);
                        }
                        (<any>result)[transform.fieldName] = transform.foreignDb().transformResult(fieldVal, t);
                    }
                    else if (typeof (<any>sql)[transform.columnName] !== 'undefined') {
                        (<any>result)[transform.fieldName] = (<any>sql)[transform.columnName];
                        delete (<any>result)[transform.columnName];
                    }
                    break;
                case 'has-one':
                    if (typeof fieldVal !== 'undefined') {
                        let t: ModelT<any> | null = null;
                        if (fieldVal) {
                            //TODO: include implicitIncludes
                            t = foreignDb.wrapResult(fieldVal, []);
                        }
                        (<any>result)[transform.fieldName] = foreignDb.transformResult(fieldVal, t);
                    }
                    break;
                case 'has-many':
                    if (typeof fieldVal !== 'undefined') {
                        let ts: ModelT<any>[] = [];
                        if (fieldVal) {
                            //TODO: include implicitIncludes
                            ts = foreignDb.wrapResults(fieldVal, []);
                        }
                        (<any>result)[transform.fieldName] = ts.map(t => foreignDb.transformResult(fieldVal, t));
                    }
                    break;
                default:
                    throw new Error(`WTF? How did you get here?`);
                }
                //TODO: has-many?
            }
            return result;
        }).bind(this);
    }
    
    fromJson(json: any): T {
        return this.wrapResult(json, []);
    }
    private wrapResult(result: TInstance, implicitIncludes: string[]): T {
        let t = new this.modelFn();
        this.copyVals(result, t);
        // if (implicitIncludes.length) {
        //     this.logger.error(result);
        //     throw new Error(`Not implemented! wrapResult with implicitIncludes: [${implicitIncludes.map(str => "'" + str + "'").join(', ')}]`);
        // }
        return this.transformResult(result, t, implicitIncludes);
    }
    private wrapResults(results: TInstance[], implicitIncludes: string[]): T[] {
        return results.map(result => this.wrapResult(result, implicitIncludes));
    }
}
