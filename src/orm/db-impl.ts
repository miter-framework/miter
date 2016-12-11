import * as Sql from 'sequelize';
import { StaticModelT, ModelT, PkType, Db,
         QueryT, FindOrCreateQueryT, CountQueryT, UpdateQueryT, DestroyQueryT,
         CountAllResults, CtorT } from '../core';
import { ModelPropertiesSym, PropMetadata, PropMetadataSym } from '../metadata';
import { Types } from '../decorators';

type CopyValMeta = {
    columnName: string,
    propertyName: string,
    transformFn: { (val: any): any }
};

export class DbImpl<T extends ModelT<PkType>, TInstance, TAttributes> implements Db<T> {
    constructor(private modelFn: StaticModelT<T>, private model: Sql.Model<TInstance, TAttributes>) {
        this.copyVals = this.createCopyValsFn();
    }
    
    async create(t: Object | T | Object[] | T[]): Promise<any> {
        if (t instanceof Array) {
            let results = await this.model.bulkCreate(<any>t);
            // return this.wrapResults(results);
            return true;
        }
        else {
            let result = await this.model.create(<any>t);
            return this.wrapResult(result);
        }
    }
    
    async findById(id: string | number) {
        let result = await this.model.findById(id);
        return result && this.wrapResult(result);
    }
    async findOne(query: QueryT) {
        let result = await this.model.findOne(query);
        return result && this.wrapResult(result);
    }
    async findOrCreate(query: Sql.WhereOptions, defaults?: Object | T): Promise<[T, boolean]> {
        let [result, created] = await this.model.findOrCreate({ where: query, defaults: <any>defaults || {} });
        return [result && this.wrapResult(result), created];
    }
    async findAndCountAll(query?: QueryT) {
        let results = await this.model.findAndCountAll(query);
        return { count: results.count, results: this.wrapResults(results.rows) };
    }
    async findAll(query?: QueryT) {
        let results = await this.model.findAll(query);
        return this.wrapResults(results);
    }
    all(query?: QueryT) {
        return this.findAll(query);
    }
    async count(query?: CountQueryT) {
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
    async update(query: number | string | T | UpdateQueryT, replace: Object): Promise<boolean | number> {
        let isId = true;
        if (this.isId(query)) query = { where: { id: query } };
        else if (this.isT(query)) query = { where: { id: query.id } };
        else isId = false;
        let [affected, results] = await this.model.update(<any>replace, query);
        return affected;
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
        if (this.isId(query)) query = { where: { id: query } };
        if (this.isT(query)) query = { where: { id: query.id } };
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
        let directTransformFn = (val) => val;
        
        var props: string[] = Reflect.getOwnMetadata(ModelPropertiesSym, this.modelFn.prototype) || [];
        for (var q = 0; q < props.length; q++) {
            var propName: string = props[q];
            var propMeta: PropMetadata = Reflect.getOwnMetadata(PropMetadataSym, this.modelFn.prototype, propName);
            if (!propMeta) throw new Error(`Could not find model property metadata for property ${this.modelFn.name || this.modelFn}.${propName}.`);
            
            let transformFn: { (val: any): any } = directTransformFn;
            if (propMeta.type == Types.DATE) transformFn = (dateStr) => new Date(dateStr);
            allProps.push({columnName: propMeta.columnName || propName, propertyName: propName, transformFn: transformFn});
        }
        
        // console.log(this.modelFn.name || this.modelFn, 'allProps:', `[\r\n    ${allProps.map(p => p.propertyName + ': ' + p.columnName).join(',\r\n    ')}\r\n]`);
        
        return function(sql: TInstance, t: any) {
            for (var q = 0; q < allProps.length; q++) {
                // console.log(allProps[q].propertyName + ':', sql[allProps[q].propertyName]);
                // t[allProps[q].propertyName] = allProps[q].transformFn(sql[allProps[q].columnName]);
                t[allProps[q].propertyName] = allProps[q].transformFn(sql[allProps[q].propertyName]);
            }
            console.log(JSON.stringify(sql));
        }
    }
    fromJson(json: any): T {
        return this.wrapResult(json);
    }
    private wrapResult(result: TInstance): T {
        let t = new this.modelFn();
        this.copyVals(result, t);
        return t;
    }
    private wrapResults(results: TInstance[]): T[] {
        return results.map(result => this.wrapResult(result));
    }
}
