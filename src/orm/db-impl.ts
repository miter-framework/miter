import * as Sql from 'sequelize';
import * as _ from 'lodash';
import { StaticModelT, ModelT, PkType, Db,
         QueryT, FindOrCreateQueryT, CountQueryT, UpdateQueryT, DestroyQueryT,
         CountAllResults, CtorT } from '../core';
import { ModelPropertiesSym, PropMetadata, PropMetadataSym,
         ModelBelongsToAssociationsSym, BelongsToMetadataSym, BelongsToMetadata,
         ModelHasOneAssociationsSym, HasOneMetadataSym, HasOneMetadata,
         ForeignModelSource } from '../metadata';
import { Types } from '../decorators';

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
type TransformValMeta = BelongsToTransformMeta | HasOneTransformMeta;

export class DbImpl<T extends ModelT<PkType>, TInstance, TAttributes> implements Db<T> {
    constructor(private modelFn: StaticModelT<T>, private model: Sql.Model<TInstance, TAttributes>) {
        this.createCopyValsFn();
        this.createTransformQuery();
    }
    
    async create(t: Object | T | Object[] | T[]): Promise<any> {
        if (t instanceof Array) {
            t = _.cloneDeep(t);
            (<Object[]>t).forEach((t, idx, arr) => { arr[idx] = this.transformQueryWhere(t) });
            let results = await this.model.bulkCreate(<any>t);
            // return this.wrapResults(results);
            return true;
        }
        else {
            t = this.transformQueryWhere(t);
            let result = await this.model.create(<any>t);
            return this.wrapResult(result);
        }
    }
    
    async findById(id: string | number, options?: QueryT) {
        if (options) options = this.transformQuery(options);
        let result = await this.model.findById(id, options);
        return result && this.wrapResult(result);
    }
    async findOne(query: QueryT) {
        query = this.transformQuery(query);
        let result = await this.model.findOne(query);
        return result && this.wrapResult(result);
    }
    async findOrCreate(query: Sql.WhereOptions, defaults?: Object | T): Promise<[T, boolean]> {
        query = this.transformQueryWhere(query);
        defaults = this.transformQueryWhere(defaults);
        let [result, created] = await this.model.findOrCreate({ where: query, defaults: <any>defaults || {} });
        return [result && this.wrapResult(result), created];
    }
    async findAndCountAll(query?: QueryT) {
        if (query) query = this.transformQuery(query);
        let results = await this.model.findAndCountAll(query);
        return { count: results.count, results: this.wrapResults(results.rows) };
    }
    async findAll(query?: QueryT) {
        if (query) query = this.transformQuery(query);
        let results = await this.model.findAll(query);
        return this.wrapResults(results);
    }
    all(query?: QueryT) {
        return this.findAll(query);
    }
    async count(query?: CountQueryT) {
        if (query) query = this.transformQuery(query);
        return await this.model.count(query);
    }
    
    async max(field: string) {
        return await this.model.max(field);
    }
    async min(field: string) {
        return await this.model.min(field);
    }
    async sum(field: string) {
        return await this.model.sum(field);
    }
    
    async save(t: T) {
        let [result, created] = await this.findOrCreate({ id: t.id }, t);
        return result;
    }
    async update(query: number | string | T | UpdateQueryT, replace: Object, returning: boolean = false): Promise<[boolean | number, any]> {
        if (this.isId(query))
            query = { where: { id: query } };
        else if (this.isT(query))
            query = { where: { id: query.id } };
        else {
            query = this.transformQuery(query);
            if (returning) {
                let results = await this.model.findAll(<QueryT>query);
                let ids = results.map((result) => (<any>result).id);
                query = { where: {id: {$in: ids } } };
            }
        }
        replace = this.transformQueryWhere(replace);
        let [affected, results]: [number, any[]] = await this.model.update(<any>replace, <UpdateQueryT>query);
        
        if (returning)
            results = this.wrapResults(await this.model.findAll(<QueryT>query));
        return [affected, results];
    }
    async updateOrCreate(query: Sql.WhereOptions, defaults: Object | T): Promise<[T, boolean]> {
        let [result, created] = await this.findOrCreate(query, defaults);
        if (!created) {
            let worked = await this.update({ where: query }, defaults);
            if (!worked) throw new Error("Failed to update or create a model.");
            let resultOrNull = await this.findOne(query);
            if (!resultOrNull) throw new Error("Updated row, but could not find it afterwards.");
            result = resultOrNull;
        }
        return [result, created];
    }
    
    async destroy(query: number | string | T | DestroyQueryT): Promise<any> {
        if (this.isId(query))
            query = { where: { id: query } };
        else if (this.isT(query))
            query = { where: { id: query.id } };
        else
            query = this.transformQuery(query);
        return await this.model.destroy(query);
    }
    
    private isId(query: any): query is (number | string) {
        return typeof query === 'number' || typeof query == 'string';
    }
    private isT(query: T | DestroyQueryT): query is T {
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
        
        // console.log(this.modelFn.name || this.modelFn, 'allProps:', `[\r\n    ${allProps.map(p => p.propertyName + ': ' + p.columnName).join(',\r\n    ')}\r\n]`);
        
        this.copyVals = function(sql: TInstance, t: any) {
            for (let q = 0; q < allProps.length; q++) {
                // console.log(allProps[q].propertyName + ':', sql[allProps[q].propertyName]);
                // t[allProps[q].propertyName] = allProps[q].transformFn(sql[allProps[q].columnName]);
                let propName = allProps[q].propertyName;
                t[propName] = allProps[q].transformFn((<any>sql)[propName]);
            }
            // console.log(JSON.stringify(sql));
        }
        //TODO: deep copy?
    }
    
    private static getForeignModelDbImpl(foreignModel: ForeignModelSource | undefined) {
        if (!foreignModel || !("db" in foreignModel)) throw new Error("Cannot get DbImpl from ForeignModel that has not been resolved");
        
        let staticModel = <StaticModelT<ModelT<any>>>foreignModel;
        return <DbImpl<ModelT<any>, any, any>>staticModel.db;
    }
    
    private transformQueryWhere: { <T>(query: T): T };
    private transformQueryInclude: { (aliases: string[]): any };
    private transformResult: { <T>(sql: TInstance, result: T): T };
    private includeFields: string[];
    
    private createTransformQuery() {
        let transforms = this.getTransforms();
        this.createTransformQueryWhere(transforms);
        this.createTransformQueryInclude(transforms);
        this.createTransformResult(transforms);
    }
    
    private transformQuery(query: any) {
        let result = _.clone(query);
        if (query.where) result.where = this.transformQueryWhere(query.where);
        if (query.include) result.include = this.transformQueryInclude(query.include);
        return result;
    }
    
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
        
        return transforms;
    }
    
    private createTransformQueryWhere(transforms: TransformValMeta[]) {
        this.transformQueryWhere = function<T>(query: T): T {
            if (!query) return query;
            query = _.clone(query);
            for (let q = 0; q < transforms.length; q++) {
                let transform = transforms[q];
                let fieldVal: any;
                switch (transform.type) {
                case 'belongs-to':
                    fieldVal = (<any>query)[transform.fieldName];
                    if (fieldVal) {
                        if (fieldVal[transform.foreignPkName]) fieldVal = fieldVal[transform.foreignPkName];
                        (<any>query)[transform.columnName] = fieldVal;
                        delete (<any>query)[transform.fieldName];
                    }
                    break;
                case 'has-one':
                    fieldVal = (<any>query)[transform.fieldName];
                    if (fieldVal) {
                        throw new Error(`Not implemented! Cannot include has-one value in where query`);
                    }
                    break;
                default:
                    throw new Error(`WTF? How did you get here?`);
                }
                //TODO: fancy where clauses!
            }
            return query;
        }
    }
    
    private createTransformQueryInclude(transforms: TransformValMeta[]) {
        function getFieldModel(field: string) {
            for (let i = 0; i < transforms.length; i++) {
                if (field == transforms[i].fieldName)
                    return transforms[i].foreignDb().model;
            }
            return null;
        }
        
        this.transformQueryInclude = function(fields: string[]): any {
            if (!fields) return fields;
            return fields.map(field => {
                let model = getFieldModel(field);
                if (!model) throw new Error(`Cannot find field ${field} from include query`);
                return {model: model, as: field};
            });
        }
    }
    
    private createTransformResult(transforms: TransformValMeta[]) {
        this.transformResult = function<T>(sql: TInstance, result: T): T {
            result = _.clone(result);
            for (let q = 0; q < transforms.length; q++) {
                let transform = transforms[q];
                let foreignDb = transform.foreignDb();
                switch (transform.type) {
                case 'belongs-to':
                    if ((<any>sql)[transform.fieldName]) { // field was included
                        let t = new foreignDb.modelFn();
                        foreignDb.copyVals((<any>sql)[transform.fieldName], t);
                        (<any>result)[transform.fieldName] = transform.foreignDb().transformResult((<any>sql)[transform.fieldName], t);
                    }
                    else if ((<any>sql)[transform.columnName]) {
                        (<any>result)[transform.fieldName] = (<any>sql)[transform.columnName];
                        delete (<any>result)[transform.columnName];
                    }
                    break;
                case 'has-one':
                    if ((<any>sql)[transform.fieldName]) { // field was included
                        let t = new foreignDb.modelFn();
                        foreignDb.copyVals((<any>sql)[transform.fieldName], t);
                        (<any>result)[transform.fieldName] = foreignDb.transformResult((<any>sql)[transform.fieldName], t);
                    }
                    break;
                default:
                    throw new Error(`WTF? How did you get here?`);
                }
                //TODO: deep copy?
            }
            return result;
        }
    }
    
    fromJson(json: any): T {
        return this.wrapResult(json);
    }
    private wrapResult(result: TInstance): T {
        let t = new this.modelFn();
        this.copyVals(result, t);
        return this.transformResult(result, t);
    }
    private wrapResults(results: TInstance[]): T[] {
        return results.map(result => this.wrapResult(result));
    }
}
