import * as Sql from 'sequelize'; 
import { StaticModelT, ModelT, PkType, Db,
         QueryT, FindOrCreateQueryT, CountQueryT, UpdateQueryT, DestroyQueryT,
         CountAllResults } from '../core';

export class DbImpl<T extends ModelT<PkType>, TInstance, TAttributes> implements Db<T> {
   constructor(private modelFn: StaticModelT<T>, private model: Sql.Model<TInstance, TAttributes>) {
   }
   
   async create(t: Object | T | Object[] | T[]): Promise<any> {
      if (t instanceof Array) {
         let results = await this.model.bulkCreate(<any>t);
         return this.wrapResults(results);
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
   
   private wrapResult(result: TInstance): T {
      return <T><any>result;
   }
   private wrapResults(results: TInstance[]): T[] {
      return results.map(result => this.wrapResult(result));
   }
}
