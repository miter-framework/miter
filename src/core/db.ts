import * as Sql from 'sequelize';

export type QueryT = Sql.FindOptions;
export type FindOrCreateQueryT = Sql.FindOrInitializeOptions<any>;
export type CountQueryT = Sql.CountOptions;
export type UpdateQueryT = Sql.UpdateOptions;
export type DestroyQueryT = Sql.DestroyOptions;

export interface CountAllResults<T> {
   count: number;
   results: T[]
};
export interface Db<T> {
   create(t: T | Object): Promise<T>;
   create(t: (T | Object)[]): Promise<T[]>;
   
   findById(id: number): Promise<T | null>;
   findOne(query: QueryT): Promise<T | null>;
   findOrCreate(query: FindOrCreateQueryT): Promise<[T, boolean]>;
   findAndCountAll(query?: QueryT): Promise<CountAllResults<T>>;
   findAll(query?: QueryT): Promise<T[]>;
   all(query?: QueryT): Promise<T[]>;
   count(query?: CountQueryT): Promise<number>;
   
   max<T>(field: string): Promise<T>;
   min<T>(field: string): Promise<T>;
   sum<T>(field: string): Promise<T>;
   
   save(t: T): Promise<T>;
   update(query: Object | T, replace: Object): Promise<[number, T]>;
   
   destroy(t: T): Promise<void>;
   destroy(query: DestroyQueryT): Promise<number>;
}
